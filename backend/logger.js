import fs from "node:fs";
import path from "node:path";
import util from "node:util";
import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const isProd = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || "info";
const logDir = process.env.LOG_DIR || path.resolve(process.cwd(), "logs");
const logToConsole = process.env.LOG_TO_CONSOLE
  ? process.env.LOG_TO_CONSOLE === "true"
  : !isProd;

function safeInspect(value) {
  return util.inspect(value, {
    depth: 6,
    colors: false,
    breakLength: 160,
    compact: true,
  });
}

function ensureLogDirExists(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch {
    // If the host filesystem is read-only or the path isn't writable,
    // don't crash the process during logger initialization.
  }
}

const consoleFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  isProd ? format.uncolorize() : format.colorize({ all: true }),
  format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    const base = `${timestamp} ${level}: ${stack || message}`;
    const metaSansSymbols = Object.fromEntries(Object.entries(meta));
    const metaKeys = Object.keys(metaSansSymbols);
    if (metaKeys.length === 0) return base;
    return `${base} ${safeInspect(metaSansSymbols)}`;
  }),
);

const fileFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
);

const loggerTransports = [];

if (logToConsole) {
  loggerTransports.push(
    new transports.Console({
      format: consoleFormat,
    }),
  );
}

if (isProd) {
  ensureLogDirExists(logDir);

  loggerTransports.push(
    new DailyRotateFile({
      dirname: logDir,
      filename: "app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: process.env.LOG_MAX_SIZE || "20m",
      maxFiles: process.env.LOG_MAX_FILES || "14d",
      level: logLevel,
      format: fileFormat,
    }),
  );

  loggerTransports.push(
    new DailyRotateFile({
      dirname: logDir,
      filename: "error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: process.env.LOG_MAX_SIZE || "20m",
      maxFiles: process.env.LOG_MAX_FILES || "30d",
      level: "error",
      format: fileFormat,
    }),
  );
}

// Configure the Winston logger. For the complete documentation see https://github.com/winstonjs/winston
const logger = createLogger({
  // To see more detailed errors, change this to 'debug' (or set LOG_LEVEL=debug)
  level: logLevel,
  transports: loggerTransports,
  // IMPORTANT: `errors({ stack: true })` must run here, at the logger's
  // top-level format (not just inside each transport's own format above).
  // `Error#message` and `Error#stack` are non-enumerable, and
  // winston-transport clones `info` via `Object.assign({}, info)` before
  // handing it to a transport's own format — which silently drops both.
  // Capturing them here, against the original Error instance, before any of
  // that cloning happens, is what makes `logger.error(someError)` (passed a
  // bare Error, no message string) log something useful instead of just
  // `{"code":500,"level":"error","timestamp":"..."}`.
  format: format.combine(format.errors({ stack: true }), format.timestamp()),
});

export default logger;
