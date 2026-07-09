import { NextResponse } from "next/server";

// 목업 백엔드 (Next route handler). 실제 DB 대신 여기서 옵션 데이터를 내려준다.
// 재고는 수량(stock)으로 주고, "품절"은 프론트가 stock <= 0으로 파생한다(파생 값은 계산).
// id는 상품코드(SKU) 형태의 고유 키. 데모라 기술 PK와 sku를 분리하지 않는다(쓸 곳이 없어 YAGNI).

// select3 — 텍스트/가격 옵션
const textOptions = [
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

// select1 — 사이즈 옵션
const sizeOptions = [
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

// select2 — 썸네일 옵션 (실제 이미지 대신 placeholder svg)
const thumbnailOptions = [
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

export async function GET() {
  return NextResponse.json({ textOptions, sizeOptions, thumbnailOptions });
}
