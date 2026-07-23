"use client";

import Link from "next/link";

import { useCartCount } from "@/entities/cart/model/useCart";
import { useWishlistCount } from "@/entities/wishlist/model/useWishlist";

// 두 화면이 공유하는 헤더. 위시리스트·장바구니 개수를 store에서 파생해 읽는다.
// 각 count는 원자적 selector라 한쪽만 바뀌면 다른 span은 리렌더되지 않는다.
export function Header() {
  const wishlistCount = useWishlistCount();
  const cartCount = useCartCount();

  return (
    <header className="week05-header">
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <span>위시리스트 {wishlistCount}</span>
        <span>장바구니 {cartCount}</span>
      </nav>
    </header>
  );
}
