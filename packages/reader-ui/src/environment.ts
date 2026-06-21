/**
 * Browser binding for the render engine's host environment. Kept tiny and
 * separate so the rest of the shell never reaches into `globalThis`
 * directly (and so tests can swap in a synthetic environment).
 */

import { browserEnvironment, type RenderEnvironment } from "@bookhelper/render-engine";

/** Build a `RenderEnvironment` bound to the current window globals. */
export function createBrowserReaderEnvironment(): RenderEnvironment {
  return browserEnvironment({
    performance: globalThis.performance,
    requestAnimationFrame: (cb) => globalThis.requestAnimationFrame(cb),
    cancelAnimationFrame: (h) => globalThis.cancelAnimationFrame(h),
    queueMicrotask: (cb) => globalThis.queueMicrotask(cb),
  });
}
