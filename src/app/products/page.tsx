import { Suspense } from "react";

import { ProductListView } from "@/_pages/products/ProductListView";
import { DEFAULT_PAGE_SIZE } from "@/features/products/model/pagination";
import { ProductGridSkeleton } from "@/features/products/ui/ProductSkeleton";

// app은 라우팅만. 화면 조합은 _pages가 소유한다.
// 목록은 URL 검색 파라미터를 읽으므로 정적 프리렌더 시점에는 값을 알 수 없다.
// Suspense로 감싸 껍데기는 미리 만들고, 조건에 따라 달라지는 부분만 클라이언트에서 채운다.
export default function ProductList() {
  return (
    <Suspense fallback={<ProductGridSkeleton count={DEFAULT_PAGE_SIZE} />}>
      <ProductListView />
    </Suspense>
  );
}
