"use client";

/**
 * **Reader** — the one-line entry point hosts use: a {@link ReaderProvider}
 * wrapping the default {@link ReaderShell} layout. Apps that need a custom
 * arrangement can compose the provider + individual components themselves.
 */

import { ReaderProvider, type ReaderProviderProps } from "./ReaderProvider.js";
import { ReaderShell } from "./ReaderShell.js";

export type ReaderProps = Omit<ReaderProviderProps, "children">;

export function Reader(props: ReaderProps): React.JSX.Element {
  return (
    <ReaderProvider {...props}>
      <ReaderShell />
    </ReaderProvider>
  );
}
