"use client";

import { type ChangeEvent, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";

import { productListQueryOptions } from "@/features/products/api/queries";
import { type PageSize } from "@/features/products/model/pagination";
import { productSearchParsers } from "@/features/products/model/searchParams";
import {
  CATEGORY_OPTIONS,
  PAGE_SIZE_OPTIONS,
  SORT_OPTIONS,
} from "@/features/products/ui/filterOptions";
import type { CategoryId, ProductSort } from "@/types/commerce";
import { Header } from "@/widgets/header/ui/Header";

import { ProductListResults } from "./ProductListResults";
import { ProductSearchInput } from "./ProductSearchInput";

import "@/shared/ui/week-05-layout.css";

export function ProductListView() {
  const [query, setQuery] = useQueryStates(productSearchParsers, { history: "push" });
  // 결과 목록은 ProductListResults가 직접 조회한다. 여기서는 페이지 이동에 필요한
  // 전체 개수만 쓰며, 같은 query key라 요청은 한 번만 나간다.
  const { data, isPlaceholderData } = useQuery(productListQueryOptions(query));

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / query.pageSize));

  // 파서가 걸러낸 값(pageSize=999 등)은 조회에는 안 쓰이지만 주소창에는 그대로 남아,
  // URL이 실제 조회 조건과 다른 말을 한다. 정규화된 값으로 덮어써 둘을 맞춘다.
  // 잘못된 URL은 뒤로 가기로 돌아갈 지점이 아니므로 replace로 바꾼다.
  // 값이 이미 정규형이면 nuqs가 상태를 갱신하지 않아 이 effect는 다시 돌지 않는다.
  useEffect(() => {
    setQuery(query, { history: "replace" });
  }, [query, setQuery]);

  // 마지막 페이지를 넘는 page는 형식상 유효해 파서가 거를 수 없다(전체 개수는 서버만 안다).
  // 응답이 온 뒤 첫 페이지로 되돌린다. 다른 무효값과 같은 규칙(무효면 기본값)을 쓴다.
  useEffect(() => {
    if (!data || query.page <= totalPages) return;
    setQuery({ page: 1 }, { history: "replace" });
  }, [data, query.page, totalPages, setQuery]);

  // 검색·카테고리·정렬을 바꾸면 이전 페이지가 유효하지 않으므로 page를 1로 되돌린다.
  // 한 객체로 넘겨 URL 쓰기가 한 번에 일어나게 한다(조회도 한 번).
  function handleSearch(q: string) {
    setQuery({ q, page: 1 });
  }

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    setQuery({ category: event.target.value as CategoryId | "all", page: 1 });
  }

  function handleSortChange(event: ChangeEvent<HTMLSelectElement>) {
    setQuery({ sort: event.target.value as ProductSort, page: 1 });
  }

  // 개수를 바꾸면 기존 페이지 번호가 범위를 벗어날 수 있어 함께 1로 되돌린다.
  // 선택지를 PAGE_SIZE_VALUES로 그리므로 값은 항상 PageSize 중 하나다.
  function handlePageSizeChange(event: ChangeEvent<HTMLSelectElement>) {
    setQuery({ pageSize: Number(event.target.value) as PageSize, page: 1 });
  }

  function goToPage(page: number) {
    setQuery({ page });
  }

  return (
    <main className="week05-page">
      <Header />

      <section className="week05-section">
        <h1>상품 목록</h1>
        <div className="week05-filters">
          <ProductSearchInput value={query.q} onSearch={handleSearch} />
          <label>
            카테고리
            <select value={query.category} onChange={handleCategoryChange}>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            정렬
            <select value={query.sort} onChange={handleSortChange}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            표시 개수
            <select value={query.pageSize} onChange={handlePageSizeChange}>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="week05-section" aria-label="상품 검색 결과" aria-busy={isPlaceholderData}>
        <ProductListResults />
        <nav className="week05-pagination" aria-label="페이지 이동">
          <button type="button" onClick={() => goToPage(query.page - 1)} disabled={query.page <= 1}>
            이전
          </button>
          <span>
            {query.page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(query.page + 1)}
            disabled={query.page >= totalPages}
          >
            다음
          </button>
        </nav>
      </section>
    </main>
  );
}
