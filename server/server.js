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
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));
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

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ReMarket")
  .then(migrateSingleMainAdminFlag)
  .then(ensureDefaultCategories)
  .then(ensureProductQuantity)
  .then(ensureMessageReadAt)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Server is running");
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

server.listen(5000, () => {
  console.log("Server running on port 5000");
});