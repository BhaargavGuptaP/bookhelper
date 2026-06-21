/**
 * **RenderEnvironment** — the host-supplied bag of timing + measurement
 * primitives the render engine uses.
 *
 * Browser globals (`requestAnimationFrame`, `performance.now`, etc.) are
 * not imported directly because:
 *
 *   1. The engine must be unit-testable in Node without jsdom.
 *   2. The same engine runs inside a Tauri shell where the timing
 *      primitives differ slightly (and could be replaced with native
 *      vsync hooks later).
 *   3. We want deterministic tests — a fake clock + a manual scheduler
 *      lets us drive the engine forward one frame at a time.
 *
 * The Reader UI (`@bookhelper/reader-ui`) will supply a browser
 * implementation; the test suite supplies a deterministic one (see
 * `test-helpers.ts`).
 */

/** Monotonic high-resolution time in milliseconds. */
export type NowFn = () => number;

/** Schedule a callback for the next animation frame. Returns a handle. */
export type RafSchedule = (cb: (timestamp: number) => void) => number;

/** Cancel a previously scheduled animation frame. Idempotent. */
export type RafCancel = (handle: number) => void;

/** Schedule a microtask (used for coalescing emits). */
export type MicrotaskSchedule = (cb: () => void) => void;

export interface RenderEnvironment {
  readonly now: NowFn;
  readonly raf: RafSchedule;
  readonly cancelRaf: RafCancel;
  readonly scheduleMicrotask: MicrotaskSchedule;
}

/**
 * A browser-shaped environment. We don't reach into `globalThis`
 * directly here — the host passes them in, but for convenience this
 * factory wraps the standard names.
 */
export function browserEnvironment(globalLike: {
  performance: { now: () => number };
  requestAnimationFrame: (cb: (t: number) => void) => number;
  cancelAnimationFrame: (handle: number) => void;
  queueMicrotask: (cb: () => void) => void;
}): RenderEnvironment {
  return {
    now: () => globalLike.performance.now(),
    raf: (cb) => globalLike.requestAnimationFrame(cb),
    cancelRaf: (h) => globalLike.cancelAnimationFrame(h),
    scheduleMicrotask: (cb) => globalLike.queueMicrotask(cb),
  };
}

/**
 * A synchronous environment for tests: every raf fires immediately with
 * a caller-controlled clock. Drives the engine forward one step at a
 * time without any timers.
 */
export function syntheticEnvironment(initialTime = 0): {
  readonly env: RenderEnvironment;
  advance(ms: number): void;
  flush(): void;
} {
  let clock = initialTime;
  let nextHandle = 1;
  const pending = new Map<number, (t: number) => void>();
  const microtasks: Array<() => void> = [];

  const env: RenderEnvironment = {
    now: () => clock,
    raf: (cb) => {
      const handle = nextHandle++;
      pending.set(handle, cb);
      return handle;
    },
    cancelRaf: (handle) => {
      pending.delete(handle);
    },
    scheduleMicrotask: (cb) => {
      microtasks.push(cb);
    },
  };

  function flush(): void {
    // Run any pending RAF callbacks once.
    const snapshot = [...pending.entries()];
    pending.clear();
    for (const [, cb] of snapshot) cb(clock);
    // Then drain microtasks.
    while (microtasks.length > 0) {
      const cb = microtasks.shift();
      cb?.();
    }
  }

  function advance(ms: number): void {
    if (ms < 0) throw new Error("advance(ms) requires a non-negative delta");
    clock += ms;
    flush();
  }

  return { env, advance, flush };
}
