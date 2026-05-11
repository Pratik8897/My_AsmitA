const normalizeRoleKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

module.exports = {
  normalizeRoleKey,
};

