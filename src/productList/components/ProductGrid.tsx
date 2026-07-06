// [분리 근거] 상품 목록의 배치(그리드/리스트)와 빈 상태를 담당. 페이지 return을 얇게 하고,
// "목록을 어떻게 배열하는가"를 카드 한 장 표현(ProductCard)과 분리한다.
import type { Product } from "../types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  viewMode: "grid" | "list";
  query: string;
  wishlist: number[];
  onToggleWishlist: (productId: number) => void;
  onSelect: (productId: number) => void;
}

export function ProductGrid({
  products,
  viewMode,
  query,
  wishlist,
  onToggleWishlist,
  onSelect,
}: ProductGridProps) {
  return (
    <section
      className="product-grid"
      style={viewMode === "list" ? { gridTemplateColumns: "1fr" } : undefined}
    >
      {products.length === 0 ? (
        <div className="empty">조건에 맞는 상품이 없습니다.</div>
      ) : (
        products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            query={query}
            isWished={wishlist.includes(product.id)}
            onToggleWishlist={onToggleWishlist}
            onSelect={onSelect}
          />
        ))
      )}
    </section>
  );
}
