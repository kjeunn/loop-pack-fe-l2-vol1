"use client";

import Link from "next/link";

import { useCartCount } from "@/entities/cart/model/useCart";
import { useHasHydrated } from "@/entities/commerce/model/useHasHydrated";
import { useWishlistCount } from "@/entities/wishlist/model/useWishlist";
import { Skeleton } from "@/shared/ui/loading/Skeleton";

// 두 화면이 공유하는 헤더. 위시리스트·장바구니 개수를 store에서 파생해 읽는다.
// 각 count는 원자적 selector라 한쪽만 바뀌면 다른 span은 리렌더되지 않는다.
export function Header() {
  const hasHydrated = useHasHydrated();
  const wishlistCount = useWishlistCount();
  const cartCount = useCartCount();

  return (
    <header className="week05-header">
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        {/* 복원 전에는 잘못된 0 대신 로딩을 보여, 새로고침 때 복원된 값으로 바로 이어지게 한다. */}
        {hasHydrated ? (
          <span>위시리스트 {wishlistCount}</span>
        ) : (
          <Skeleton className="inline-block h-5 w-20 rounded align-middle" />
        )}
        {hasHydrated ? (
          <span>장바구니 {cartCount}</span>
        ) : (
          <Skeleton className="inline-block h-5 w-20 rounded align-middle" />
        )}
      </nav>
    </header>
  );
}
