const { normalizeRoleKey } = require("../utils/roleUtils");

module.exports = function requireRole(allowedRoles = []) {
  const allowed = allowedRoles.map(normalizeRoleKey);

  return (req, res, next) => {
    const role =
      req.userType ||
      req.headers["x-user-type"] ||
      req.headers["x-usertype"] ||
      "";
    const normalized = normalizeRoleKey(role);

    if (allowed.length === 0 || allowed.includes(normalized)) return next();

    return res.status(403).json({
      success: false,
      message: "Access denied due to permission",
    });
  };
};

