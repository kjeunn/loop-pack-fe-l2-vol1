"use client";

import { useEffect, useRef } from "react";

import { useRouter } from "next/navigation";

import { trackEvent } from "@/analytics/schema";
import { useCartHydrated, useCartIds } from "@/entities/cart";
import { useCreateOrder } from "@/features/orders/api/mutations";
import buttonStyles from "@/shared/ui/button.module.css";
import { LoadingDots } from "@/shared/ui/loading-dots/LoadingDots";

import styles from "./OrderForm.module.css";

export function OrderForm() {
  const router = useRouter();
  const cartHydrated = useCartHydrated();
  const cartIds = useCartIds();
  const createOrder = useCreateOrder();

  // 주문서 진입을 1회 기록한다. 하이드레이션 전엔 cart가 비어 있어 복원이 끝나고 담긴 게 있을 때 찍는다.
  const orderStartTracked = useRef(false);
  useEffect(() => {
    if (orderStartTracked.current || !cartHydrated || cartIds.length === 0) {
      return;
    }
    orderStartTracked.current = true;
    trackEvent("order_start", { productIds: cartIds });
  }, [cartHydrated, cartIds]);

  const submit = () => {
    // 성공 시 useCreateOrder가 cart를 비우므로, 그 전에 주문 상품을 캡처해 order_complete에 싣는다.
    const orderedIds = cartIds;
    // cart는 수량 개념이 없어(5주차 결정) 담긴 각 상품을 수량 1로 주문한다.
    createOrder.mutate(
      { items: orderedIds.map((productId) => ({ productId, quantity: 1 })) },
      {
        // 화면의 일만 여기서 — cart 비움·내역 무효화(정합성)는 useCreateOrder가 맡는다.
        onSuccess: () => {
          trackEvent("order_complete", { productIds: orderedIds });
          router.push("/orders");
        },
      },
    );
  };

  // 성공 후에도 화면 전환(주문내역으로 push)이 끝날 때까지 로딩을 유지한다.
  const isSubmitting = createOrder.isPending || createOrder.isSuccess;

  // 복원 전엔 빈 목록을 잘못 보여주지 않도록 하이드레이션을 기다린다.
  if (!cartHydrated) {
    return <p className={styles.message}>불러오는 중…</p>;
  }
  // 주문 성공 시 useCreateOrder가 cart를 비우지만, 전환 전까지 "담은 상품 없음"이 번쩍이지 않게 성공 중엔 유지한다.
  if (cartIds.length === 0 && !createOrder.isSuccess) {
    return <p className={styles.message}>담은 상품이 없습니다.</p>;
  }

  return (
    <>
      <ul className={styles.list}>
        {cartIds.map((id) => (
          <li key={id} className={styles.item}>
            {id}
          </li>
        ))}
      </ul>
      {createOrder.isError && (
        <p role="alert" className={styles.error}>
          {createOrder.error?.message}
        </p>
      )}
      <button
        type="button"
        className={buttonStyles.primary}
        onClick={submit}
        disabled={isSubmitting}
        aria-label={isSubmitting ? "주문 중" : undefined}
      >
        {isSubmitting ? <LoadingDots /> : "주문하기"}
      </button>
    </>
  );
}
