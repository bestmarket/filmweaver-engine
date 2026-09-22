/**
 * Structured application logging.
 *
 * Every log line is a single JSON object so it can be parsed downstream.
 * Sensitive fields are redacted before serialization — API keys, passwords,
 * tokens and credentials must never reach the log pipeline.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEY_PATTERN =
  /(password|passwd|secret|token|api[-_]?key|apikey|authorization|credential|cookie|session|private[-_]?key|hash|bearer)/i;

export const REDACTED = "[REDACTED]";

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[MAX_DEPTH]";
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redact(item, depth + 1);
    }
    return out;
  }
  return value;
}

export type LogContext = Record<string, unknown>;

export type Logger = {
  child: (context: LogContext) => Logger;
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
};

type Sink = (line: string) => void;

const defaultSink: Sink = (line) => {
  // eslint-disable-next-line no-console
  console.log(line);
};

export function createLogger(base: LogContext = {}, sink: Sink = defaultSink): Logger {
  const emit = (level: LogLevel, message: string, context?: LogContext) => {
    const payload = {
      level,
      message,
      at: new Date().toISOString(),
      ...(redact({ ...base, ...context }) as LogContext),
    };
    sink(JSON.stringify(payload));
  };

  return {
    child: (context) => createLogger({ ...base, ...context }, sink),
    debug: (message, context) => emit("debug", message, context),
    info: (message, context) => emit("info", message, context),
    warn: (message, context) => emit("warn", message, context),
    error: (message, context) => emit("error", message, context),
  };
}

export const logger = createLogger({ app: "ai-movie-studio" });
