/**
 * **ReaderLifecycle** — a strict state machine over a single reader session.
 *
 * Every method that mutates a `ReaderSession` (open, goTo, close, dispatch,
 * register plugin) checks the lifecycle first. This prevents whole classes
 * of races: trying to navigate before the document has loaded, dispatching
 * a command into a session that has been closed, double-activating a
 * plugin, etc. — each of those becomes a typed `ReaderLifecycleError`
 * instead of silently no-oping or, worse, mutating stale state.
 *
 * Transitions, in order:
 *
 *   ```
 *   idle ── open() ──▶ opening ── (adapter ready) ──▶ ready
 *                                                       │
 *     ┌──────────────────────────────────────────────── │
 *     │                                                 ▼
 *     │                                           close() ──▶ closing ──▶ closed
 *     │
 *     └── error path: any state can transition to `error`, which behaves
 *         like `closed` for new commands but preserves the failure for
 *         observers.
 *   ```
 *
 * The set of legal next states is fully enumerated below. New states must
 * extend this table; ad-hoc transitions are not allowed.
 */

/** The lifecycle state of a session. */
export type LifecycleState = "idle" | "opening" | "ready" | "closing" | "closed" | "error";

/** All states allowed as the *next* state from a given state. */
export const lifecycleTransitions: Readonly<Record<LifecycleState, readonly LifecycleState[]>> =
  Object.freeze({
    idle: ["opening", "closed"],
    opening: ["ready", "error", "closing"],
    ready: ["closing", "error"],
    closing: ["closed", "error"],
    closed: [],
    error: ["closing", "closed"],
  });

/**
 * Predicate: is `next` reachable from `current` per the table above?
 * Used by the session before committing a transition.
 */
export function canTransition(current: LifecycleState, next: LifecycleState): boolean {
  return lifecycleTransitions[current].includes(next);
}

/**
 * Predicate: is the session in a state where reading/navigating
 * commands make sense? (i.e. exactly `ready`).
 */
export function isInteractive(state: LifecycleState): boolean {
  return state === "ready";
}

/** Predicate: is the session terminal — no more transitions possible? */
export function isTerminal(state: LifecycleState): boolean {
  return state === "closed";
}
