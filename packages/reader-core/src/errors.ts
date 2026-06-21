/**
 * Typed error catalogue for the reader platform.
 *
 * These errors are framework-free (no NestJS, no HTTP). When the reader is
 * embedded in a Next.js/web app or a Tauri shell, the host translates them
 * into UI states; when it's exercised in tests, instanceof checks suffice.
 *
 * The class hierarchy is intentionally shallow — every error is a subclass
 * of {@link ReaderError} so a catch-all can identify reader failures
 * cleanly, and every error has a stable string `code` so logs and product
 * analytics can pivot on it without depending on class names.
 */

/** Base class for every error thrown by reader-core or by an adapter/plugin. */
export abstract class ReaderError extends Error {
  /** Stable machine-readable code (e.g. `E_READER_LIFECYCLE`). */
  abstract readonly code: string;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

/**
 * The session is in the wrong lifecycle state for the operation.
 * E.g. calling `goTo()` before `open()` resolves, or after `close()`.
 */
export class ReaderLifecycleError extends ReaderError {
  readonly code = "E_READER_LIFECYCLE";
  readonly currentState: string;
  readonly attempted: string;

  constructor(currentState: string, attempted: string, message?: string) {
    super(message ?? `Reader is in state "${currentState}"; cannot ${attempted}.`);
    this.currentState = currentState;
    this.attempted = attempted;
  }
}

/**
 * An adapter rejected, threw, or returned a malformed value when the core
 * called one of its contract methods.
 */
export class AdapterError extends ReaderError {
  readonly code = "E_READER_ADAPTER";
  readonly adapter: string;
  readonly operation: string;

  constructor(adapter: string, operation: string, message: string, options?: { cause?: unknown }) {
    super(`Adapter "${adapter}" failed during "${operation}": ${message}`, options);
    this.adapter = adapter;
    this.operation = operation;
  }
}

/**
 * The reader was asked to use a capability the current adapter does not
 * declare. UIs should hide the affordance, but commands invoked
 * programmatically still need to fail loudly.
 */
export class CapabilityNotSupportedError extends ReaderError {
  readonly code = "E_READER_CAPABILITY";
  readonly capability: string;

  constructor(capability: string, message?: string) {
    super(message ?? `Capability "${capability}" is not supported by this document.`);
    this.capability = capability;
  }
}

/** Dispatching a command for which no handler is registered. */
export class CommandNotFoundError extends ReaderError {
  readonly code = "E_READER_COMMAND_NOT_FOUND";
  readonly command: string;

  constructor(command: string) {
    super(`No handler is registered for command "${command}".`);
    this.command = command;
  }
}

/**
 * A command handler threw. The original error is preserved on `cause`.
 * Wrapping lets callers reliably catch "any command failure" while
 * preserving the underlying stack for logging.
 */
export class CommandExecutionError extends ReaderError {
  readonly code = "E_READER_COMMAND_EXECUTION";
  readonly command: string;

  constructor(command: string, cause: unknown) {
    super(`Command "${command}" failed.`, { cause });
    this.command = command;
  }
}

/** Registering a plugin whose name collides with one already registered. */
export class DuplicatePluginError extends ReaderError {
  readonly code = "E_READER_DUPLICATE_PLUGIN";
  readonly pluginName: string;

  constructor(pluginName: string) {
    super(`Plugin "${pluginName}" is already registered on this session.`);
    this.pluginName = pluginName;
  }
}

/** A plugin's `activate` / `deactivate` threw. */
export class PluginActivationError extends ReaderError {
  readonly code = "E_READER_PLUGIN_ACTIVATION";
  readonly pluginName: string;

  constructor(pluginName: string, cause: unknown) {
    super(`Plugin "${pluginName}" failed to activate.`, { cause });
    this.pluginName = pluginName;
  }
}

/**
 * A locator references a docVersion that does not match the current
 * document, or refers to a missing block, with no quote-anchor fallback.
 * Adapters throw this when their three-strategy cascade exhausts.
 */
export class LocatorResolutionError extends ReaderError {
  readonly code = "E_READER_LOCATOR";
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

/**
 * `errorCodeFor(err)` — collapse any thrown value into a stable code
 * suitable for logs/telemetry. Unknown errors collapse to `E_READER_UNKNOWN`.
 */
export function errorCodeFor(err: unknown): string {
  if (err instanceof ReaderError) return err.code;
  return "E_READER_UNKNOWN";
}
