import { queryOptions, useQuery } from "@tanstack/react-query";

import { useSession } from "@/entities/session/ui/SessionProvider";
import type { Order } from "@/features/orders/model/types";
import { fetchJson } from "@/shared/api/fetcher";

type OrderListResponse = { orders: Order[] };

// 사용자와 무관한 접두. 무효화처럼 "누구 것이든 전부"를 가리킬 때 쓴다.
export const ordersQueryKeyRoot = ["orders"] as const;

// 주문내역은 보호 자원이다. meta.auth로 표시해 401(만료)이 전역 핸들러의 로그인 리다이렉트로 이어지게 한다.
// 키를 사용자별로 가른다 — 같은 브라우저에서 사용자가 바뀌어도(로그아웃 뒤 다른 계정, 만료 뒤 다른 계정)
// 이전 사용자의 캐시가 다음 사용자에게 내려가지 않는다. 지우는 걸 기억하는 게 아니라 키가 막는다.
// userId가 null이면 익명이라 발사되지 않는다(useOrders의 enabled).
export function ordersQueryOptions(userId: string | null) {
  return queryOptions({
    queryKey: [...ordersQueryKeyRoot, userId] as const,
    queryFn: () => fetchJson<OrderListResponse>("/api/orders"),
    meta: { auth: true },
  });
}

// 익명은 발사하지 않는다(enabled). 로그인 상태(서버가 내린 값)일 때만 조회한다.
export function useOrders() {
  const { user, isLoggedIn } = useSession();
  return useQuery({
    ...ordersQueryOptions(user?.id ?? null),
    enabled: isLoggedIn,
    select: (data) => data.orders,
  });
}
