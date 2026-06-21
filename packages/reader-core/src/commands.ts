/**
 * **ReaderCommands** — typed command bus with built-in undo/redo.
 *
 * Every user-initiated action — opening a document, navigating, zooming,
 * searching, highlighting — is dispatched as a command. Commands are
 * *first-class objects*: they have names, payloads, handlers, and a
 * place in an undo stack. This makes them:
 *
 *   • Testable — dispatch, then assert state.
 *   • Inspectable — telemetry can log every command without monkey-patching.
 *   • Replayable — recorded command sequences can drive E2E tests.
 *   • Extensible — plugins register handlers (`commands.register(...)`)
 *     for their own commands without touching reader internals.
 *
 * The built-in command catalogue covers everything Sprint 3A is asked to
 * abstract: navigation, view controls, and the undo/redo primitives.
 * Highlight/Bookmark/Search are listed as **type-level placeholders**
 * (no handlers registered here — those belong to their plugins) so the
 * shape is reserved. Adapters/plugins extend the catalogue via TypeScript
 * declaration merging on `ReaderCommandMap`.
 */

import { CommandExecutionError, CommandNotFoundError } from "./errors.js";
import type { Locator, PointLocator } from "./locator.js";

// ──────────────────────────────────────────────────────────────────────────
// Command catalogue
// ──────────────────────────────────────────────────────────────────────────

/**
 * The canonical command map. **Names use `namespace.verb`** — same
 * convention as events — so logs can correlate the two streams.
 *
 * Augment via declaration merging:
 *
 * ```ts
 * declare module "@bookhelper/reader-core" {
 *   interface ReaderCommandMap {
 *     "highlight.create": { range: Locator; color: string };
 *   }
 * }
 * ```
 */
export interface ReaderCommandMap {
  // Document lifecycle ─────────────────────────────────────────────
  "reader.open": { docId: string };
  "reader.close": Record<string, never>;

  // Navigation ─────────────────────────────────────────────────────
  "reader.goto": { locator: PointLocator };
  "reader.next-page": Record<string, never>;
  "reader.previous-page": Record<string, never>;
  "reader.next-chapter": Record<string, never>;
  "reader.previous-chapter": Record<string, never>;

  // View ───────────────────────────────────────────────────────────
  "reader.zoom-in": Record<string, never>;
  "reader.zoom-out": Record<string, never>;
  "reader.set-zoom": { zoom: number };

  // Discovery placeholders (handlers come from plugins) ─────────
  "reader.search": { query: string };
  "reader.bookmark": { locator: PointLocator };
  "reader.highlight": { range: Locator };

  // Undo/redo ──────────────────────────────────────────────────────
  "reader.undo": Record<string, never>;
  "reader.redo": Record<string, never>;
}

/** Every legal command name. */
export type ReaderCommandName = keyof ReaderCommandMap;

/** Payload type for a given command. */
export type ReaderCommandPayload<C extends ReaderCommandName> = ReaderCommandMap[C];

/**
 * Optional return value from a command handler — used by some commands
 * (e.g. `reader.search`) to return a result alongside the side effect.
 */
export type ReaderCommandResult = unknown;

// ──────────────────────────────────────────────────────────────────────────
// Undo
// ──────────────────────────────────────────────────────────────────────────

/**
 * An invocation record kept on the undo/redo stack. A command that opts
 * into undo returns an `UndoableInvocation`; commands that are not
 * undoable (e.g. `reader.open`) simply return their result or `void`.
 *
 * `undo` and `redo` are explicit — re-running `undo` is *not* a valid
 * redo for most operations (it would undo the inverse). Plugins are
 * expected to capture both sides in the closure they produce.
 */
export interface UndoableInvocation {
  /** Reverses the effect of this command. May be async. */
  readonly undo: () => void | Promise<void>;
  /**
   * Re-applies the effect after an undo. May be async. If omitted the
   * invocation is treated as "one-shot undoable" — once undone, it is
   * removed and not pushed onto the redo stack.
   */
  readonly redo?: () => void | Promise<void>;
  /**
   * Optional label shown in undo menus / a11y announcements
   * ("Undo highlight").
   */
  readonly label?: string;
}

/** Handler signature: a function from payload → optional undo record. */
export type ReaderCommandHandler<C extends ReaderCommandName> = (
  payload: ReaderCommandPayload<C>,
) => ReaderCommandResult | UndoableInvocation | Promise<ReaderCommandResult | UndoableInvocation>;

// ──────────────────────────────────────────────────────────────────────────
// Bus
// ──────────────────────────────────────────────────────────────────────────

/**
 * The plugin-facing surface. `dispatch` to execute, `register` to add a
 * new handler. Each command may have **at most one** handler — commands
 * are explicit contracts, not event broadcasts.
 */
export interface ReaderCommandBus {
  dispatch<C extends ReaderCommandName>(
    command: C,
    payload: ReaderCommandPayload<C>,
  ): Promise<ReaderCommandResult>;
  register<C extends ReaderCommandName>(command: C, handler: ReaderCommandHandler<C>): () => void;
  /** Is a handler installed for this command? */
  has(command: ReaderCommandName): boolean;
  /** Programmatic undo (mirrors the `reader.undo` command). */
  undo(): Promise<boolean>;
  /** Programmatic redo (mirrors the `reader.redo` command). */
  redo(): Promise<boolean>;
  /** True if there is at least one undoable invocation on the stack. */
  canUndo(): boolean;
  /** True if there is at least one undoable invocation on the redo stack. */
  canRedo(): boolean;
}

/**
 * Construct a command bus.
 *
 * The bus owns its undo/redo stacks. `maxUndoDepth` bounds memory — the
 * oldest invocation is dropped (and its undo lost) when the stack
 * exceeds the limit. 100 is a balance between long sessions and bounded
 * memory; tests can override.
 */
export function createCommandBus(options: { maxUndoDepth?: number } = {}): ReaderCommandBus {
  const maxDepth = options.maxUndoDepth ?? 100;
  const handlers = new Map<ReaderCommandName, ReaderCommandHandler<ReaderCommandName>>();
  const undoStack: UndoableInvocation[] = [];
  const redoStack: UndoableInvocation[] = [];

  function register<C extends ReaderCommandName>(
    command: C,
    handler: ReaderCommandHandler<C>,
  ): () => void {
    handlers.set(command, handler as ReaderCommandHandler<ReaderCommandName>);
    return () => {
      // Only unregister if we're still the active handler — a later
      // override should not be undone by an earlier owner's cleanup.
      if (handlers.get(command) === (handler as ReaderCommandHandler<ReaderCommandName>)) {
        handlers.delete(command);
      }
    };
  }

  async function dispatch<C extends ReaderCommandName>(
    command: C,
    payload: ReaderCommandPayload<C>,
  ): Promise<ReaderCommandResult> {
    // Undo/redo are handled by the bus itself; user-supplied handlers
    // cannot intercept them (consistent semantics across sessions).
    if (command === "reader.undo") {
      const ok = await undo();
      return ok;
    }
    if (command === "reader.redo") {
      const ok = await redo();
      return ok;
    }

    const handler = handlers.get(command);
    if (!handler) throw new CommandNotFoundError(command);

    let result: ReaderCommandResult | UndoableInvocation;
    try {
      result = await handler(payload);
    } catch (err) {
      throw new CommandExecutionError(command, err);
    }

    if (isUndoable(result)) {
      undoStack.push(result);
      // A new action invalidates the redo stack — standard editor model.
      redoStack.length = 0;
      while (undoStack.length > maxDepth) undoStack.shift();
      return undefined;
    }
    return result;
  }

  async function undo(): Promise<boolean> {
    const inv = undoStack.pop();
    if (!inv) return false;
    try {
      await inv.undo();
    } catch (err) {
      // Re-push so the user can retry; surface the error to the caller.
      undoStack.push(inv);
      throw new CommandExecutionError("reader.undo", err);
    }
    // Only invocations that supplied a `redo` can be re-applied.
    if (inv.redo) redoStack.push(inv);
    return true;
  }

  async function redo(): Promise<boolean> {
    const inv = redoStack.pop();
    if (!inv || !inv.redo) return false;
    try {
      await inv.redo();
    } catch (err) {
      redoStack.push(inv);
      throw new CommandExecutionError("reader.redo", err);
    }
    undoStack.push(inv);
    return true;
  }

  return {
    dispatch,
    register,
    has(command) {
      return handlers.has(command);
    },
    undo,
    redo,
    canUndo() {
      return undoStack.length > 0;
    },
    canRedo() {
      return redoStack.length > 0;
    },
  };
}

function isUndoable(value: unknown): value is UndoableInvocation {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { undo?: unknown }).undo === "function"
  );
}
