// k6's console, which prints to k6's output (https://grafana.com/docs/k6/latest/javascript-api/#console).
// @types/k6 leaves it out, and the DOM's or Node's declarations would bring globals k6 doesn't have.
declare const console: {
  debug(...data: unknown[]): void;
  info(...data: unknown[]): void;
  log(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
};
