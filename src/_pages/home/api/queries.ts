import { queryOptions } from "@tanstack/react-query";

import type { Category, Product } from "@/entities/product/model/types";
import { fetchJson } from "@/shared/api/fetcher";

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};

// 홈 배너·카테고리·인기·신상품은 머천다이징 값이라 세션 중 거의 변하지 않는다.
// staleTime을 길게 둬 화면을 오가도 재요청하지 않는다.
const HOME_STALE_TIME = 1000 * 60 * 5;

export function homeQueryOptions() {
  return queryOptions({
    queryKey: ["home"] as const,
    queryFn: () => fetchJson<HomeResponse>("/api/home"),
    staleTime: HOME_STALE_TIME,
  });
}
