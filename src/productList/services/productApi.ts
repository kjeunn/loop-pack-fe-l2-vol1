// [분리 근거] /api/products 통신을 한곳에 캡슐화.
// 컴포넌트·hook이 fetch·URL 조립 같은 전송 구현에 직접 묶이지 않도록(DIP),
// 쿼리 객체를 받아 응답만 돌려주는 함수로 노출한다. 통신 스펙이 바뀌면 이 파일만 손본다.
import type { CategoryValue, ProductListResponse, SortBy } from "../types";

export interface ProductQuery {
  category: CategoryValue;
  sortBy: SortBy;
  searchQuery: string;
  page: number;
  pageSize: number;
  minPrice: number | "";
  maxPrice: number | "";
}

export async function fetchProducts(query: ProductQuery): Promise<ProductListResponse> {
  const params = new URLSearchParams({
    category: query.category,
    sort: query.sortBy,
    q: query.searchQuery,
    page: String(query.page),
    size: String(query.pageSize),
  });
  if (query.minPrice !== "") params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== "") params.set("maxPrice", String(query.maxPrice));

  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) throw new Error(`API 호출 실패 (status: ${res.status})`);
  return res.json();
}
