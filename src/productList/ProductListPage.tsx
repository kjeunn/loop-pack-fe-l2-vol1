import { useEffect, useState } from "react";

import { FilterPanel } from "./components/FilterPanel";
import { Pagination } from "./components/Pagination";
import { ProductGrid } from "./components/ProductGrid";
import { SearchBar } from "./components/SearchBar";
import { SortSelect } from "./components/SortSelect";
import { ViewModeToggle } from "./components/ViewModeToggle";
import { PAGE_SIZE } from "./constants";
import { useProductQuery } from "./hooks/useProductQuery";
import { useProducts } from "./hooks/useProducts";
import { useRecentlyViewed } from "./hooks/useRecentlyViewed";
import { useUrlQuerySync } from "./hooks/useUrlQuerySync";
import { useWishlist } from "./hooks/useWishlist";
import { getTotalPages } from "./utils/getTotalPages";

import "./ProductListPage.css";

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

  const { products, totalCount, isLoading, error } = useProducts({
    category,
    sortBy,
    searchQuery,
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

  useUrlQuerySync({ category, searchQuery, page, sortBy, minPrice, maxPrice, inStockOnly });

  // totalPages는 여기서 파생해 Pagination엔 "페이지 수"만 넘긴다.
  // nav 위젯은 페이지 수만 알면 되고, totalCount·PAGE_SIZE(리스트/페이지 크기 개념)에 결합될 필요가 없다.
  const totalPages = getTotalPages(totalCount, PAGE_SIZE);

  // ─── 로딩/에러는 early return ───────────────────────────
  if (isLoading && products.length === 0) {
    return <div className="loading">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>오류가 발생했습니다: {error.message}</p>
        <button onClick={() => window.location.reload()}>다시 시도</button>
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
      {isLoading && products.length > 0 && (
        <div className="background-loading">데이터 갱신 중...</div>
      )}
    </div>
  );
}
