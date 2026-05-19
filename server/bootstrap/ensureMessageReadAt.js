const Message = require("../models/MessageModel");

/**
 * הודעות ישנות בלי שדה readAt — מקבלות תאריך קריאה (לא מוחקים כלום).
 * כל ההודעות נשארות במסד; רק שדה readAt מתעדכן כדי שהמונה יציג "לא נקראו" נכון.
 */
module.exports = async function ensureMessageReadAt() {
  const now = new Date();
  const res = await Message.updateMany(
    { readAt: { $exists: false } },
    { $set: { readAt: now } }
  );
  if (res.modifiedCount > 0) {
    console.log(`Messages: סומנו ${res.modifiedCount} הודעות ישנות כנקראו (מיגרציית readAt)`);
  }
};
