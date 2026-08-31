"use client";

import Link from "next/link";

import { useCartHydrated, useCartIds, useRemoveFromCart } from "@/entities/cart";

// 공개 장바구니 뷰. 익명으로 담은 것을 로그인 없이 확인·수정하고, 주문은 주문서에서 로그인 게이트를 지난다.
export function CartList() {
  const cartHydrated = useCartHydrated();
  const cartIds = useCartIds();
  const removeFromCart = useRemoveFromCart();

  // 복원 전엔 빈 목록을 잘못 보여주지 않도록 하이드레이션을 기다린다.
  if (!cartHydrated) {
    return <p>불러오는 중…</p>;
  }
  if (cartIds.length === 0) {
    return <p>장바구니가 비어 있습니다.</p>;
  }

  return (
    <>
      <ul>
        {cartIds.map((id) => (
          <li key={id}>
            {id}
            <button type="button" onClick={() => removeFromCart(id)}>
              빼기
            </button>
          </li>
        ))}
      </ul>
      <Link href="/order-form">주문하기</Link>
    </>
  );
}
