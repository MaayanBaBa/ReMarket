require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/UserModel");

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

async function main() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ReMarket";
  const ADMIN_EMAIL = requireEnv("ADMIN_EMAIL").trim().toLowerCase();
  const ADMIN_PASSWORD = requireEnv("ADMIN_PASSWORD");
  const ADMIN_FIRST_NAME = (process.env.ADMIN_FIRST_NAME || "Admin").trim();
  const ADMIN_LAST_NAME = (process.env.ADMIN_LAST_NAME || "Main").trim();

  await mongoose.connect(MONGO_URI);

  async function setOnlyMainAdmin(userDoc) {
    userDoc.isMainAdmin = true;
    await userDoc.save();
    await User.updateMany({ _id: { $ne: userDoc._id } }, { $set: { isMainAdmin: false } });
  }

  const existingAdmin = await User.findOne({ status: "admin" });
  if (existingAdmin) {
    // If admin already exists, we either update it (same email),
    // or transfer admin role to the email configured in .env (single-admin rule).
    if (String(existingAdmin.email || "").trim().toLowerCase() === ADMIN_EMAIL) {
      existingAdmin.password = ADMIN_PASSWORD;
      existingAdmin.firstName = ADMIN_FIRST_NAME;
      existingAdmin.lastName = ADMIN_LAST_NAME;
      await setOnlyMainAdmin(existingAdmin);
      console.log(`Updated admin: ${existingAdmin.email}`);
      await mongoose.disconnect();
      return;
    }

    const targetUser = await User.findOne({ email: ADMIN_EMAIL });
    if (targetUser) {
      // Transfer admin role to the configured user, and downgrade previous admin.
      targetUser.status = "admin";
      targetUser.password = ADMIN_PASSWORD;
      targetUser.firstName = ADMIN_FIRST_NAME;
      targetUser.lastName = ADMIN_LAST_NAME;
      targetUser.isMainAdmin = true;

      existingAdmin.status = "buyer";
      existingAdmin.isMainAdmin = false;

      await Promise.all([targetUser.save(), existingAdmin.save()]);
      await User.updateMany({ _id: { $ne: targetUser._id } }, { $set: { isMainAdmin: false } });
      console.log(`Transferred admin to: ${targetUser.email} (previous admin downgraded)`);
      await mongoose.disconnect();
      return;
    }

    // No user with ADMIN_EMAIL exists → reuse the existing admin account, but update it to desired email/details.
    existingAdmin.email = ADMIN_EMAIL;
    existingAdmin.password = ADMIN_PASSWORD;
    existingAdmin.firstName = ADMIN_FIRST_NAME;
    existingAdmin.lastName = ADMIN_LAST_NAME;
    await setOnlyMainAdmin(existingAdmin);
    console.log(`Reassigned existing admin to: ${existingAdmin.email}`);
    await mongoose.disconnect();
    return;
  }

  const existingEmail = await User.findOne({ email: ADMIN_EMAIL });
  if (existingEmail) {
    existingEmail.status = "admin";
    existingEmail.password = ADMIN_PASSWORD;
    existingEmail.firstName = ADMIN_FIRST_NAME;
    existingEmail.lastName = ADMIN_LAST_NAME;
    await setOnlyMainAdmin(existingEmail);
    console.log(`Upgraded existing user to admin: ${existingEmail.email}`);
    await mongoose.disconnect();
    return;
  }

  const admin = new User({
    firstName: ADMIN_FIRST_NAME,
    lastName: ADMIN_LAST_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    status: "admin",
    isMainAdmin: true,
  });

  await admin.save();
  await User.updateMany({ _id: { $ne: admin._id } }, { $set: { isMainAdmin: false } });
  console.log(`Created admin: ${admin.email}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

