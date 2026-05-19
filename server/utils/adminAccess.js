function isMainAdminUser(user) {
  if (!user || user.status !== "admin") return false;
  if (user.isMainAdmin === true) return true;
  const envEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const userEmail = String(user.email || "").trim().toLowerCase();
  return !!(envEmail && userEmail === envEmail);
}

module.exports = { isMainAdminUser };
