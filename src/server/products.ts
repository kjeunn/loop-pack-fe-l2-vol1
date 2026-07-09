import type { SizeOption } from "@/components/ui/select/SizeSelect";
import type { TextOption } from "@/components/ui/select/TextSelect";
import type { ThumbnailOption } from "@/components/ui/select/ThumbnailSelect";

// 서버 데이터 접근 계층. 지금은 목업을 반환하지만, 실제 DB/API가 붙으면 getProductOptions 본문만 바꾼다.
// route.ts(HTTP 노출)와 page(서버 컴포넌트)가 함께 호출한다 — 서버는 self-fetch 없이 이걸 직접 부른다.
// 재고는 수량(stock)으로 두고 "품절"은 프론트가 stock<=0으로 파생한다. id는 상품코드(SKU) 형태 고유 키.

const textOptions: TextOption[] = [
  {
    id: "BGL-PL-10",
    title: "[최대할인] 베이글 5+5개",
    price: 21000,
    unitPrice: 2100,
    freeShipping: true,
    stock: 20,
  },
  { id: "BGL-PL-01", title: "베이글 1개", price: 4200, unitPrice: 4200, stock: 35 },
  { id: "BGL-PL-03", title: "베이글 3개", price: 12000, unitPrice: 4000, stock: 0 },
];

const sizeOptions: SizeOption[] = [
  { id: "SHOE-240", size: 24, stock: 3, deliveryText: "내일(토) 도착보장" },
  { id: "SHOE-250", size: 25, stock: 0 },
  { id: "SHOE-260", size: 26, stock: 12, deliveryText: "내일(토) 도착보장" },
  { id: "SHOE-270", size: 27, stock: 0, deliveryText: "내일(토) 도착보장" },
  { id: "SHOE-280", size: 28, stock: 5, deliveryText: "내일(토) 도착보장" },
  { id: "SHOE-290", size: 29, stock: 5, deliveryText: "내일(토) 도착보장" },
  { id: "SHOE-300", size: 30, stock: 5, deliveryText: "내일(토) 도착보장" },
  { id: "SHOE-310", size: 31, stock: 5, deliveryText: "내일(토) 도착보장" },
  { id: "SHOE-320", size: 32, stock: 3, deliveryText: "내일(토) 도착보장" },
  { id: "SHOE-330", size: 33, stock: 5, deliveryText: "내일(토) 도착보장" },
];

const thumbnailOptions: ThumbnailOption[] = [
  {
    id: "AMP-GRT-100",
    title: "그로우턴 앰플 100ml기획(+100ml)",
    image: "/next.svg",
    discountRate: 2,
    price: 38800,
    sameDayDelivery: true,
    stock: 8,
  },
  {
    id: "AMP-GRT-130",
    title: "그로우턴 앰플 130ml기획(+30ml)",
    image: "/next.svg",
    discountRate: 2,
    price: 33800,
    sameDayDelivery: true,
    stock: 14,
  },
];

export interface ProductOptions {
  textOptions: TextOption[];
  sizeOptions: SizeOption[];
  thumbnailOptions: ThumbnailOption[];
}

// 느린 소스라면 이 await 동안 page의 Suspense fallback이 스켈레톤을 스트리밍한다.
export async function getProductOptions(): Promise<ProductOptions> {
  return { textOptions, sizeOptions, thumbnailOptions };
}
