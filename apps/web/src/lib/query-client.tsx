"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "./api-client";

/**
 * App-wide TanStack Query provider. The client is created once per session
 * (state hook) so it survives Fast Refresh but isn't shared across the
 * server. Default options favor a calm UX: stale time 30 s (avoids
 * thrashing on focus changes), no automatic retries on 4xx (the user is
 * already told via the toast — see UX §14).
 */
export function QueryProvider({ children }: { readonly children: ReactNode }): ReactElement {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
          },
          mutations: { retry: 0 },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
