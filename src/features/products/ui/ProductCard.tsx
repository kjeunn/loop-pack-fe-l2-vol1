import Image from "next/image";

import type { Product } from "@/types/commerce";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
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
        {/* 찜·담기는 전역 클라이언트 상태(Zustand)를 붙일 자리라 지금은 정적으로 둔다. */}
        <button type="button" aria-label={`${product.name} 위시리스트`} aria-pressed={false}>
          찜
        </button>
        <button type="button" aria-label={`${product.name} 장바구니`} aria-pressed={false}>
          담기
        </button>
      </div>
    </article>
  );
}
