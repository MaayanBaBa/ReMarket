require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, true); // permissive default for now; tighten later if needed
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

/** Block requests with a clear error when MongoDB isn't connected (instead of 10s buffering) */
app.use((req, res, next) => {
  // 1 = connected, 2 = connecting; let real APIs through only when connected
  if (mongoose.connection.readyState === 1) return next();
  // health/root endpoints still work
  if (req.path === "/" || req.path === "/health") return next();
  return res.status(503).json({
    message:
      "השרת מחובר, אבל אין חיבור פעיל למסד הנתונים. בדקי MONGO_URI ב-Render והרשאות IP ב-MongoDB Atlas.",
    code: "DB_NOT_CONNECTED",
  });
});
app.use("/users", require("./routes/userRoutes"));
app.use("/categories", require("./routes/categoryRoutes"));
app.use("/products", require("./routes/productRoutes"));
app.use("/sales", require("./routes/saleRoutes"));
app.use("/messages", require("./routes/messageRoutes"));
app.use("/subscriptions", require("./routes/subscriptionRoutes"));

const User = require("./models/UserModel");
const ensureDefaultCategories = require("./bootstrap/ensureDefaultCategories");
const ensureProductQuantity = require("./bootstrap/ensureProductQuantity");
const ensureMessageReadAt = require("./bootstrap/ensureMessageReadAt");

async function migrateSingleMainAdminFlag() {
  try {
    const admins = await User.find({ status: "admin" }).select("_id isMainAdmin");
    if (admins.length !== 1) return;
    const only = admins[0];
    if (only.isMainAdmin) return;
    await User.updateMany({}, { $set: { isMainAdmin: false } });
    await User.updateOne({ _id: only._id }, { $set: { isMainAdmin: true } });
    console.log("Main admin: סומן מנהל ראשי יחיד במסד (מיגרציה אוטומטית)");
  } catch (e) {
    console.warn("main admin migration:", e.message);
  }
}

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ReMarket";
// Fail fast instead of Mongoose's default 10s buffering, so the API returns a real error
mongoose.set("bufferTimeoutMS", 2000);

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(migrateSingleMainAdminFlag)
  .then(ensureDefaultCategories)
  .then(ensureProductQuantity)
  .then(ensureMessageReadAt)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err?.message || err);
  });

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});
mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    dbState: mongoose.connection.readyState,
  });
});

const { initChatIo } = require("./socket/chatHub");
initChatIo(io);

app.use((err, req, res, _next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "קובץ התמונה גדול מדי (מקסימום 5MB)" });
  }
  if (err && String(err.message || "").includes("ניתן להעלות רק")) {
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || "שגיאת שרת" });
  }
  res.status(500).json({ message: "שגיאת שרת" });
});

const PORT = Number(process.env.PORT) || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});