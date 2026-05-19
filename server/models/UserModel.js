const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  city: String,
  status: { 
    type: String, 
    enum: ["admin", "seller", "buyer"], //עשיתי אינם לסטטוס כי יש 3 סוגים בלבד וזה מונע שמישהו ישלח סטטוס לא חוקי
    default: "buyer" 
  },
  sellerSubscriptionUntil: { type: Date, default: null },
  isMainAdmin: { type: Boolean, default: false },
  password: { type: String, required: true },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (this.isModified("email") && this.email) {
    this.email = String(this.email).trim().toLowerCase();
  }
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(String(this.password), 10);
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(String(password), String(this.password));
};

module.exports = mongoose.model("UserModel", userSchema);