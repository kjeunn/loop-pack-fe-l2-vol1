"use client";

import Image from "next/image";

import { useAddToCart, useIsInCart, useRemoveFromCart } from "@/entities/cart/model/useCart";
import type { Product } from "@/entities/product/model/types";
import { useIsWishlisted, useToggleWishlist } from "@/entities/wishlist/model/useWishlist";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const isWishlisted = useIsWishlisted(product.id);
  const toggleWishlist = useToggleWishlist();

  const isInCart = useIsInCart(product.id);
  const addToCart = useAddToCart();
  const removeFromCart = useRemoveFromCart();

  return (
    <article className="week05-product">
      <Image
        className="week05-image"
        src={product.image}
        alt={product.name}
        width={400}
        height={400}
      />
      <p>{product.brand}</p>
      <h3>{product.name}</h3>
      <strong>{product.price.toLocaleString("ko-KR")}원</strong>
      <div>
        <button
          type="button"
          className="week05-wish"
          aria-label={`${product.name} 위시리스트`}
          aria-pressed={isWishlisted}
          onClick={() => toggleWishlist(product.id)}
        >
          {/* 상태는 aria-pressed가 전하므로 아이콘은 장식이다. 채움은 CSS가 그 속성으로 제어한다. */}
          <svg className="week05-wish-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
        <button
          type="button"
          className="week05-cart"
          aria-label={`${product.name} 장바구니`}
          aria-pressed={isInCart}
          onClick={() => (isInCart ? removeFromCart(product.id) : addToCart(product.id))}
        >
          담기
        </button>
      </div>
    </article>
  );
}
