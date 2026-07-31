import type { Product } from "@/entities/product/model/types";
import { ProductCard } from "@/features/products/ui/ProductCard";

interface ProductSectionProps {
  title: string;
  products: Product[];
}

// 제목과 상품 그리드를 묶은 홈의 한 구획. 상품이 없으면 빈 문구를 대신 보여준다.
export function ProductSection({ title, products }: ProductSectionProps) {
  return (
    <section className="week05-section">
      <h2>{title}</h2>
      {products.length === 0 ? (
        <p>표시할 상품이 없습니다.</p>
      ) : (
        <div className="week05-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
