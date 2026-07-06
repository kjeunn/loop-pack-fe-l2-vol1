// [분리 근거] 상품 도메인 규칙(할인율·NEW·HOT·BEST·품절·무료배송) 계산.
// 렌더 본문에 인라인으로 흩어져 있던 비즈니스 규칙이라, 화면과 무관한 도메인 계산으로 utils에 모으고
// 흩어진 매직넘버를 명명 상수로 드러냈다. 호출부는 raw product만 넘기고 계산 결과를 쓰기만 한다.
import type { Product } from "../types";

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

const NEW_WITHIN_DAYS = 7;
const MAX_ALMOST_SOLD_OUT_STOCK = 5;
const MIN_HOT_DISCOUNT_RATE = 30;
const MIN_BEST_RATING = 4.5;
const MIN_BEST_REVIEW_COUNT = 100;
const MIN_FREE_SHIPPING_PRICE = 50000;

export interface ProductBadges {
  discountRate: number;
  isNew: boolean;
  isHot: boolean;
  isBest: boolean;
  isSoldOut: boolean;
  isAlmostSoldOut: boolean;
  isFreeShipping: boolean;
}

export function getProductBadges(product: Product): ProductBadges {
  const discountRate = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  const createdDate = new Date(product.createdAt);
  const now = new Date();
  const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / ONE_DAY_MS);

  const isNew = daysSinceCreated <= NEW_WITHIN_DAYS;
  const isHot = discountRate >= MIN_HOT_DISCOUNT_RATE;
  const isBest = product.rating >= MIN_BEST_RATING && product.reviewCount >= MIN_BEST_REVIEW_COUNT;
  const isSoldOut = product.stock === 0;
  const isAlmostSoldOut = product.stock > 0 && product.stock <= MAX_ALMOST_SOLD_OUT_STOCK;
  const isFreeShipping = product.price >= MIN_FREE_SHIPPING_PRICE;

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
