const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Product = require("../models/ProductModel");
const Message = require("../models/MessageModel");

let io;

function threadRoomId(productId, userA, userB) {
  const [a, b] = [String(userA), String(userB)].sort();
  return `thread:${String(productId)}:${a}:${b}`;
}

async function verifyJoinThread(userId, productId, peerId) {
  if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(peerId)) {
    return false;
  }
  const me = String(userId);
  const peer = String(peerId);
  if (me === peer) return false;

  const product = await Product.findById(productId).lean();
  if (!product) return false;
  const seller = String(product.user);

  if (me !== seller && peer !== seller) return false;

  if (me === seller) {
    return Message.exists({
      product: productId,
      sender: peer,
      receiver: me,
    });
  }

  if (peer !== seller) return false;

  return Message.exists({
    product: productId,
    $or: [
      { sender: me, receiver: seller },
      { sender: seller, receiver: me },
    ],
  });
}

function initChatIo(ioInstance) {
  io = ioInstance;

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        String(socket.handshake.headers?.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token) return next(new Error("Unauthorized"));
      const secret = process.env.JWT_SECRET || "dev_secret_change_me";
      const payload = jwt.verify(token, secret);
      socket.userId = String(payload.userId);
      next();
    } catch (e) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on("join_thread", async ({ productId, peerId }, cb) => {
      try {
        const ok = await verifyJoinThread(socket.userId, productId, peerId);
        if (!ok) {
          return typeof cb === "function" ? cb({ ok: false, message: "אין הרשאה לצ'אט זה" }) : null;
        }
        const room = threadRoomId(productId, socket.userId, peerId);
        socket.join(room);
        if (typeof cb === "function") cb({ ok: true, room });
      } catch (e) {
        if (typeof cb === "function") cb({ ok: false, message: e.message || "שגיאה" });
      }
    });

    socket.on("leave_thread", ({ productId, peerId }) => {
      if (!productId || !peerId) return;
      socket.leave(threadRoomId(productId, socket.userId, peerId));
    });

    socket.on("typing", ({ productId, peerId, active }) => {
      if (!productId || !peerId) return;
      const room = threadRoomId(productId, socket.userId, peerId);
      socket.to(room).emit("peer_typing", {
        userId: socket.userId,
        active: !!active,
      });
    });
  });
}

function emitMessageNew(productId, userA, userB, messageDoc) {
  if (!io) return;
  const room = threadRoomId(productId, userA, userB);
  const payload = typeof messageDoc?.toJSON === "function" ? messageDoc.toJSON() : messageDoc;
  io.to(room).emit("message:new", payload);
}

function emitInboxRefresh(userId) {
  if (!io || !userId) return;
  io.to(`user:${String(userId)}`).emit("inbox:refresh");
}

module.exports = {
  initChatIo,
  emitMessageNew,
  emitInboxRefresh,
  threadRoomId,
};
