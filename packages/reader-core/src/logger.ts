/**
 * A minimal, dependency-free logger interface for the reader core.
 *
 * The reader runs in many places — the web BFF (where the host wires
 * pino via `@bookhelper/telemetry`), a service worker, a Tauri shell,
 * a unit test. We can't assume any of those, so the core defines its
 * own narrow `Logger` shape. Hosts that want structured logging adapt
 * pino to it; the default `noopLogger` is silent.
 *
 * Keeping the interface this small (5 methods + `child`) lets us bridge
 * it to almost any logger (pino, bunyan, console, Tauri's tracing) in
 * a one-line adapter.
 */

/** Tiny structured log surface. */
export interface Logger {
  trace(obj: Record<string, unknown> | string, msg?: string): void;
  debug(obj: Record<string, unknown> | string, msg?: string): void;
  info(obj: Record<string, unknown> | string, msg?: string): void;
  warn(obj: Record<string, unknown> | string, msg?: string): void;
  error(obj: Record<string, unknown> | string, msg?: string): void;
  /** Returns a logger that prepends `bindings` to every record. */
  child(bindings: Record<string, unknown>): Logger;
}

/** A logger that does nothing. Used as the default in tests and headless code. */
export const noopLogger: Logger = Object.freeze({
  trace() {},
  debug() {},
  info() {},
  warn() {},
  error() {},
  child(): Logger {
    return noopLogger;
  },
});
