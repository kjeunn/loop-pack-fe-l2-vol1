import { NextResponse } from "next/server";

import { getProductOptions } from "@/features/product-options/api/products";

// 옵션 데이터를 HTTP로 노출하는 목업 백엔드. 데이터는 features/product-options/api가 소유한다.
// (서버 컴포넌트는 이 라우트를 fetch하지 않고 getProductOptions를 직접 부른다 — self-fetch 회피.)
export async function GET() {
  return NextResponse.json(await getProductOptions());
}
