"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useCartHydrated, useCartIds, useClearCart } from "@/entities/cart";
import { useCreateOrder } from "@/features/orders/api/mutations";
import { ordersQueryOptions } from "@/features/orders/api/queries";

export function OrderForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cartHydrated = useCartHydrated();
  const cartIds = useCartIds();
  const clearCart = useClearCart();
  const createOrder = useCreateOrder();

  const submit = () => {
    // cart는 수량 개념이 없어(5주차 결정) 담긴 각 상품을 수량 1로 주문한다.
    createOrder.mutate(
      { items: cartIds.map((productId) => ({ productId, quantity: 1 })) },
      {
        onSuccess: () => {
          clearCart();
          // 새 주문이 내역에 바로 보이도록 무효화하고 주문내역으로 이동한다.
          void queryClient.invalidateQueries({ queryKey: ordersQueryOptions().queryKey });
          router.push("/orders");
        },
      },
    );
  };

  // 복원 전엔 빈 목록을 잘못 보여주지 않도록 하이드레이션을 기다린다.
  if (!cartHydrated) {
    return <p>불러오는 중…</p>;
  }
  if (cartIds.length === 0) {
    return <p>담은 상품이 없습니다.</p>;
  }

  return (
    <>
      <ul>
        {cartIds.map((id) => (
          <li key={id}>{id}</li>
        ))}
      </ul>
      {createOrder.isError && <p role="alert">{createOrder.error?.message}</p>}
      <button type="button" onClick={submit} disabled={createOrder.isPending}>
        {createOrder.isPending ? "주문 중…" : "주문하기"}
      </button>
    </>
  );
}
