import Image from "next/image";

import type { Product } from "@/entities/product/model/types";
import { AddToCartButton } from "@/features/add-to-cart/ui/AddToCartButton";
import { WishlistButton } from "@/features/toggle-wishlist/ui/WishlistButton";

interface ProductCardProps {
  product: Product;
}

// 상품 표현(entities)과 담기·찜 행위(features)를 조합한 자족 카드.
// widget이 feature를 아래로 import하므로 entities→features 역방향이 발생하지 않는다.
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
        <WishlistButton productId={product.id} productName={product.name} />
        <AddToCartButton productId={product.id} productName={product.name} />
      </div>
    </article>
  );
}
