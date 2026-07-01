// [분리 근거] 상품 카드 한 장의 표현을 담당. 그리드 map 본문에 있던 큰 JSX와 파생 계산을 떼어,
// 그리드는 "목록 배치", 카드는 "한 장 표현"으로 책임을 나눈다.
// raw product를 받아 badges·가격 포맷을 스스로 계산한다(계산된 상태를 props로 받지 않음).
import type { Product } from "../types";
import { formatPrice } from "../utils/formatPrice";
import { getProductBadges } from "../utils/productBadges";
import { HighlightedText } from "./HighlightedText";

interface ProductCardProps {
  product: Product;
  query: string; // 검색어 강조용
  isWished: boolean;
  onToggleWishlist: (productId: number) => void;
  onSelect: (productId: number) => void;
}

export function ProductCard({
  product,
  query,
  isWished,
  onToggleWishlist,
  onSelect,
}: ProductCardProps) {
  const badges = getProductBadges(product);
  const formattedPrice = formatPrice(product.price);
  const formattedOriginal = product.originalPrice ? formatPrice(product.originalPrice) : null;

  return (
    <article className="product-card" onClick={() => onSelect(product.id)}>
      <div className="image-wrap">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {badges.discountRate > 0 && (
          <span className="badge badge-discount">{badges.discountRate}% 할인</span>
        )}
        {badges.isNew && <span className="badge badge-new">NEW</span>}
        {badges.isHot && <span className="badge badge-hot">특가</span>}
        {badges.isBest && <span className="badge badge-best">BEST</span>}
        {badges.isSoldOut && <span className="badge badge-soldout">품절</span>}
        {!badges.isSoldOut && badges.isAlmostSoldOut && (
          <span className="badge badge-warning">품절 임박</span>
        )}
      </div>

      <div className="card-body">
        <h3 className="product-name">
          <HighlightedText text={product.name} query={query} />
        </h3>
        <div className="price-area">
          {formattedOriginal && <span className="original-price">{formattedOriginal}</span>}
          <span className="price">{formattedPrice}</span>
          {badges.isFreeShipping && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                color: "#2e7d32",
                fontWeight: 600,
              }}
            >
              무료배송
            </span>
          )}
        </div>
        <div className="rating-area">
          <span className="rating">★ {product.rating.toFixed(1)}</span>
          <span className="review-count">({product.reviewCount.toLocaleString()})</span>
          <button
            style={{
              marginLeft: "auto",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 16,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            aria-label="위시리스트 토글"
          >
            {isWished ? "♥" : "♡"}
          </button>
        </div>
      </div>
    </article>
  );
}
