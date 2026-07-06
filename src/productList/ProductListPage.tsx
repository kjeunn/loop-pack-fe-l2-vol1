import { useEffect, useState } from "react";

import { FilterPanel } from "./components/FilterPanel";
import { Pagination } from "./components/Pagination";
import { ProductGrid } from "./components/ProductGrid";
import { SearchBar } from "./components/SearchBar";
import { SortSelect } from "./components/SortSelect";
import { ViewModeToggle } from "./components/ViewModeToggle";
import { PAGE_SIZE } from "./constants";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { useProductQuery } from "./hooks/useProductQuery";
import { useProducts } from "./hooks/useProducts";
import { useRecentlyViewed } from "./hooks/useRecentlyViewed";
import { useWishlist } from "./hooks/useWishlist";
import { getTotalPages } from "./utils/getTotalPages";

import "./ProductListPage.css";

// 타이핑이 멈추고 이 시간(ms)이 지나면 검색어를 fetch에 반영한다(입력 중 과요청 방지).
const SEARCH_DEBOUNCE_MS = 300;

export function ProductListPage() {
  const {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    inStockOnly,
    page,
    onCategoryChange,
    onMinPriceChange,
    onMaxPriceChange,
    onSortChange,
    onSearchChange,
    onInStockOnlyChange,
    onPageChange,
    onResetFilters,
  } = useProductQuery();

  // 그리드/리스트 표시 토글 — 쿼리·URL과 무관한 화면 상태라 페이지가 소유.
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { wishlist, toggleWishlist } = useWishlist();
  const { addRecentlyViewed } = useRecentlyViewed();

  // 검색어는 즉시 상태로 두되(입력창 반응성 유지), fetch를 유발하는 값만 디바운스해 타이핑 중 과요청을 막는다.
  const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const { products, totalCount, isLoading, isInitialLoading, error, retry } = useProducts({
    category,
    sortBy,
    searchQuery: debouncedSearchQuery,
    page,
    pageSize: PAGE_SIZE,
    minPrice,
    maxPrice,
    inStockOnly,
  });

  // ─── 페이지가 바뀔 때 스크롤 맨 위로 ────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  // totalPages는 여기서 파생해 Pagination엔 "페이지 수"만 넘긴다.
  // nav 위젯은 페이지 수만 알면 되고, totalCount·PAGE_SIZE(리스트/페이지 크기 개념)에 결합될 필요가 없다.
  const totalPages = getTotalPages(totalCount, PAGE_SIZE);

  // ?page=99처럼 마지막 페이지를 넘는 URL로 들어오면 결과가 비어 빈 화면이 된다.
  // 마지막 페이지가 아니라 첫 페이지로 되돌린다: 필터 변경 시 첫 페이지로 가는 규칙과 같은 "정상 진입점"이고,
  // 명백히 범위를 벗어난 값이라 요청한 페이지 근처를 지켜줄 의미가 약하다(첫 페이지는 항상 존재).
  // 로딩 전 totalPages는 신뢰할 수 없어 첫 응답을 받은 뒤(!isInitialLoading)에만 판정한다.
  useEffect(() => {
    if (!isInitialLoading && page > totalPages) {
      onPageChange(1);
    }
  }, [isInitialLoading, page, totalPages, onPageChange]);

  // ─── 로딩/에러는 early return ───────────────────────────
  // 전체 화면 로딩은 첫 결과를 받기 전(isInitialLoading)에만 띄운다.
  // 로드 이후에는 결과가 비어도 UI(헤더·검색·필터)를 유지해 화면이 통째로 사라지지 않게 한다.
  if (isInitialLoading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>오류가 발생했습니다: {error.message}</p>
        <button onClick={() => retry()}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className="product-list-page">
      <header className="page-header">
        <h1>상품 목록</h1>
        <p className="total-count">
          총 {totalCount.toLocaleString()}개의 상품
          {wishlist.length > 0 && <span> · 위시리스트 {wishlist.length}개</span>}
        </p>
      </header>

      {/* ─── 필터 패널 ──────────────────────────────────── */}
      <FilterPanel
        category={category}
        minPrice={minPrice}
        maxPrice={maxPrice}
        inStockOnly={inStockOnly}
        onCategoryChange={onCategoryChange}
        onMinPriceChange={onMinPriceChange}
        onMaxPriceChange={onMaxPriceChange}
        onInStockOnlyChange={onInStockOnlyChange}
        onResetFilters={onResetFilters}
      />

      {/* ─── 검색 + 정렬 + 보기 모드 ───────────────────── */}
      <section className="search-sort">
        <SearchBar searchQuery={searchQuery} onSearchChange={onSearchChange} />
        <SortSelect sortBy={sortBy} onSortChange={onSortChange} />
        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </section>

      {/* ─── 상품 그리드 ────────────────────────────────── */}
      <ProductGrid
        products={products}
        viewMode={viewMode}
        query={searchQuery}
        wishlist={wishlist}
        onToggleWishlist={toggleWishlist}
        onSelect={addRecentlyViewed}
      />

      {/* ─── 페이지네이션 ───────────────────────────────── */}
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />

      {/* ─── 백그라운드 로딩 인디케이터 ─────────────────── */}
      {/* 갱신 로딩(첫 로딩 제외)에서는 결과가 비어도 "갱신 중"을 표시한다 */}
      {isLoading && !isInitialLoading && (
        <div className="background-loading">데이터 갱신 중...</div>
      )}
    </div>
  );
}
