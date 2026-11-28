type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: string | number | boolean | undefined;
}

function log(
  level: LogLevel,
  message: string,
  extra: Record<string, unknown> = {},
): void {
  if (process.env.NODE_ENV === "test") return; // Avoid noise in test output.
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...extra,
  };
  console.log(JSON.stringify(entry));
}

export { log };
export type { LogLevel, LogEntry };
