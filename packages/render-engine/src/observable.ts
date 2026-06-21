/**
 * A tiny **single-channel observable** used internally by the render
 * engine's submodules (viewport, zoom, virtualization, …).
 *
 * Deliberately *not* an event bus: there is one stream, one payload
 * shape, no listener identity. Subscribers may be added/removed at any
 * time. Emits are synchronous; misbehaving subscribers (throwers) are
 * caught and reported through an optional `onError` so a single broken
 * UI binding can't tear down the whole engine.
 *
 * This isn't a re-implementation of RxJS — we explicitly *don't* want
 * dependencies in this package.
 */

export type Unsubscribe = () => void;

export interface Observable<T> {
  /** Subscribe; receives every emit until `Unsubscribe` is called. */
  subscribe(listener: (value: T) => void): Unsubscribe;
  /** Current value snapshot (synchronous). */
  readonly value: T;
}

export interface Emitter<T> extends Observable<T> {
  /** Push a new value to all subscribers. */
  emit(next: T): void;
  /** Replace the value without notifying (rare; used during batch). */
  setSilently(next: T): void;
}

export function createEmitter<T>(
  initial: T,
  options?: {
    readonly equals?: (a: T, b: T) => boolean;
    readonly onError?: (err: unknown) => void;
  },
): Emitter<T> {
  const equals = options?.equals ?? Object.is;
  const onError = options?.onError;
  let current = initial;
  const listeners = new Set<(value: T) => void>();

  return {
    get value() {
      return current;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    emit(next) {
      if (equals(current, next)) return;
      current = next;
      // Snapshot to tolerate unsubscribes during iteration.
      const snapshot = [...listeners];
      for (const listener of snapshot) {
        try {
          listener(current);
        } catch (err) {
          if (onError) onError(err);
          else throw err;
        }
      }
    },
    setSilently(next) {
      current = next;
    },
  };
}
