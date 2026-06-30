// [분리 근거] 상품 도메인 규칙(할인율·NEW·HOT·BEST·품절·무료배송) 계산.
// 렌더 본문에 인라인으로 흩어져 있던 비즈니스 규칙이라, 화면과 무관한 순수 계산으로 utils에 모으고
// 흩어진 매직넘버를 명명 상수로 드러냈다. 호출부는 raw product만 넘기고 계산 결과를 쓰기만 한다.
import type { Product } from "../types";

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

const NEW_WITHIN_DAYS = 7;
const ALMOST_SOLD_OUT_STOCK = 5;
const HOT_DISCOUNT_RATE = 30;
const BEST_RATING = 4.5;
const BEST_REVIEW_COUNT = 100;
const FREE_SHIPPING_PRICE = 50000;

export interface ProductBadges {
  discountRate: number;
  isNew: boolean;
  isHot: boolean;
  isBest: boolean;
  isSoldOut: boolean;
  isAlmostSoldOut: boolean;
  isFreeShipping: boolean;
}

// now를 인자로 받아 순수 함수로 유지(같은 입력 → 같은 결과, 테스트 용이).
export function getProductBadges(product: Product, now: number = Date.now()): ProductBadges {
  const discountRate = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  const daysSinceCreated = Math.floor((now - new Date(product.createdAt).getTime()) / ONE_DAY_MS);

  const isNew = daysSinceCreated <= NEW_WITHIN_DAYS;
  const isHot = discountRate >= HOT_DISCOUNT_RATE;
  const isBest = product.rating >= BEST_RATING && product.reviewCount >= BEST_REVIEW_COUNT;
  const isSoldOut = product.stock === 0;
  const isAlmostSoldOut = product.stock > 0 && product.stock <= ALMOST_SOLD_OUT_STOCK;
  const isFreeShipping = product.price >= FREE_SHIPPING_PRICE;

  return {
    discountRate,
    isNew,
    isHot,
    isBest,
    isSoldOut,
    isAlmostSoldOut,
    isFreeShipping,
  };
}
