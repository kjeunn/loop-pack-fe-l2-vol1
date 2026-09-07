import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useClearCart } from "@/entities/cart";
import { ordersQueryOptions } from "@/features/orders/api/queries";
import type { Order, OrderItem } from "@/features/orders/model/types";
import { fetchJson } from "@/shared/api/fetcher";

type CreateOrderInput = { items: OrderItem[] };
type CreateOrderResult = { order: Order };

// 주문 생성도 보호 자원이다(meta.auth).
// 성공 뒤 정합성(cart 비움·내역 무효화)은 여기 useMutation 옵션에 둔다 — mutate 레벨 콜백은
// 컴포넌트가 언마운트되면 불리지 않아, 요청 중 화면을 떠나면 서버엔 주문이 남고 cart는 그대로가 되어
// 재주문 시 중복이 난다. 화면 전환·계측은 화면의 일이라 호출 컴포넌트가 mutate 레벨에서 맡는다.
export function useCreateOrder() {
  const queryClient = useQueryClient();
  const clearCart = useClearCart();
  return useMutation({
    mutationFn: (input: CreateOrderInput) =>
      fetchJson<CreateOrderResult>("/api/orders", { method: "POST", body: input }),
    meta: { auth: true },
    onSuccess: () => {
      clearCart();
      void queryClient.invalidateQueries({ queryKey: ordersQueryOptions().queryKey });
    },
  });
}
