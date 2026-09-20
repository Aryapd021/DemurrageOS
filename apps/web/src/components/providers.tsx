"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClientScopeProvider } from "@/lib/stores/client-scope-context";
import { AuthProvider } from "@/lib/stores/auth-context";

import { ThemeProvider } from "@/lib/stores/theme-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ClientScopeProvider>{children}</ClientScopeProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
