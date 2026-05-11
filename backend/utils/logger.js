const fs = require("fs");
const path = require("path");

function getLogDir() {
  return process.env.LOG_DIR
    ? path.resolve(process.env.LOG_DIR)
    : path.join(__dirname, "..", "logs");
}

function ensureLogDirExists() {
  const dir = getLogDir();
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // best-effort
  }
  return dir;
}

function getLogFilePath(date = new Date()) {
  const dir = ensureLogDirExists();
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return path.join(dir, `app-${yyyy}-${mm}-${dd}.log`);
}

function getLogLevel() {
  return (process.env.LOG_LEVEL || "info").toLowerCase();
}

const levelPriority = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function shouldLog(level) {
  const current = levelPriority[getLogLevel()] ?? levelPriority.info;
  const incoming = levelPriority[level] ?? levelPriority.info;
  return incoming <= current;
}

async function writeLine(line) {
  try {
    await fs.promises.appendFile(getLogFilePath(), `${line}\n`, "utf8");
  } catch {
    // eslint-disable-next-line no-console
    console.error(line);
  }
}

function log(level, message, meta = {}) {
  if (!shouldLog(level)) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  void writeLine(JSON.stringify(entry));
}

module.exports = {
  getLogDir,
  getLogFilePath,
  log,
  cleanupOldLogFiles,
};

async function cleanupOldLogFiles(days = 30) {
  const dir = getLogDir();
  const maxAgeMs = Number(days) * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(maxAgeMs) || maxAgeMs <= 0) return { deleted: 0 };

  let entries = [];
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return { deleted: 0 };
  }

  const now = Date.now();
  let deleted = 0;

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const name = entry.name;
    if (!/^app-\d{4}-\d{2}-\d{2}\.log$/.test(name)) continue;

    const filePath = path.join(dir, name);
    try {
      const stat = await fs.promises.stat(filePath);
      const ageMs = now - stat.mtimeMs;
      if (ageMs > maxAgeMs) {
        await fs.promises.unlink(filePath);
        deleted += 1;
      }
    } catch {
      // ignore
    }
  }

  return { deleted };
}
