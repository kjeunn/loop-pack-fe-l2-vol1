"use client";

import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { useHydrateCart } from "@/entities/cart/model/useCart";
import { useHydrateWishlist } from "@/entities/wishlist/model/useWishlist";
import { makeQueryClient } from "@/shared/api/queryClient";

interface ProvidersProps {
  children: ReactNode;
}

let browserQueryClient: QueryClient | undefined = undefined;

// 서버에서는 요청마다 새 QueryClient를 만들어 사용자 간 캐시 유출을 막고,
// 브라우저에서는 하나를 재사용해 리렌더·Suspense에도 캐시가 유지되게 한다.
function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();
  useHydrateCart();
  useHydrateWishlist();

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
      {/* 조건별 query key가 실제로 갈라지는지, staleTime이 재요청을 막는지 확인하는 용도.
          프로덕션 번들에서는 자동으로 빠진다. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
