const fs = require("fs");
const { getLogFilePath } = require("../utils/logger");
const { writeAuditLog } = require("../utils/auditLogger");

async function readTailBytes(filePath, maxBytes) {
  const stat = await fs.promises.stat(filePath);
  const size = stat.size;
  const start = Math.max(0, size - maxBytes);
  const length = size - start;
  const handle = await fs.promises.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, start);
    return buffer.toString("utf8");
  } finally {
    await handle.close();
  }
}

function safeParseJsonLines(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const parsed = [];
  for (const line of lines) {
    try {
      parsed.push(JSON.parse(line));
    } catch {
      // ignore
    }
  }
  return parsed;
}

function parseYyyyMmDd(value) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map((v) => Number(v));
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

async function getRecentLogs(req, res) {
  void writeAuditLog({
    req,
    module: "ADMIN_SECURITY",
    action: "VIEW_SYSTEM_LOGS",
    description: "Admin viewed system logs",
    status: "SUCCESS",
    new_value: {
      lines: req.query.lines || 200,
      date: req.query.date || null,
    },
  });

  const linesRequested = Number(req.query.lines || 200);
  const lines = Number.isFinite(linesRequested)
    ? Math.max(1, Math.min(2000, Math.floor(linesRequested)))
    : 200;

  const date = parseYyyyMmDd(req.query.date);
  const filePath = getLogFilePath(date || new Date());

  try {
    const text = await readTailBytes(filePath, 1024 * 1024);
    const entries = safeParseJsonLines(text);
    const lastEntries = entries.slice(-lines);
    res.json({
      success: true,
      file: filePath,
      count: lastEntries.length,
      logs: lastEntries,
    });
  } catch (err) {
    if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) {
      return res.status(404).json({
        success: false,
        message: "Log file not found for requested date",
        file: filePath,
      });
    }
    throw err;
  }
}

module.exports = {
  getRecentLogs,
};
