import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";

import { ProductListView } from "@/_pages/products/ui/ProductListView";
import { productListQueryOptions } from "@/features/products/api/queries";
// features/products는 barrel(index)을 두지 않는다. 세그먼트를 직접 import한다.
// searchParams 파서는 서버 loader·serializer로도 그대로 재사용한다(검증 로직 중복 없음).
import {
  loadProductListSearchParams,
  serializeProductListSearchParams,
} from "@/features/products/model/searchParams";
import { getServerQueryClient } from "@/shared/api/getServerQueryClient";

// app은 라우팅만. 화면 조합은 _pages가 소유한다.
// searchParams를 서버에서 읽어 라우트가 동적이 되므로, useSearchParams의 CSR-bailout이 사라져
// Suspense 경계가 필요 없다(빌드로 확인). fetchQuery로 목록을 프리패치해 page 범위를 검사(초과 시 redirect)하고,
// HydrationBoundary로 넘겨 클라 재요청을 막는다(홈과 일관, waterfall 제거).
export default async function ProductList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await loadProductListSearchParams(searchParams);
  const queryClient = getServerQueryClient();
  const data = await queryClient.fetchQuery(productListQueryOptions(query));

  // page가 마지막을 넘으면 서버에서 캐노니컬 URL(page 1)로 정정한다.
  // 클라이언트는 이후 유효한 page만 보므로, 목록 자리에 잘못된 page 상태가 생기지 않는다.
  const totalPages = Math.max(1, Math.ceil(data.totalCount / query.pageSize));
  if (query.page > totalPages) {
    redirect(serializeProductListSearchParams("/products", { ...query, page: 1 }));
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductListView />
    </HydrationBoundary>
  );
}
