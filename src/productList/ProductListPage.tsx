import { useEffect, useState } from "react";

import { FilterPanel } from "./components/FilterPanel";
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
  });

  // "재고 있는 것만" 토글은 클라이언트 파생 필터 — 서버 재요청 없이 렌더 시 거른다.
  const filteredProducts = inStockOnly ? products.filter((p) => p.stock > 0) : products;

  // ─── 페이지가 바뀔 때 스크롤 맨 위로 ────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  useUrlQuerySync({ category, searchQuery, page, sortBy, minPrice, maxPrice, inStockOnly });

  // ─── 페이지네이션 계산 (인라인) ─────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageNumbers: number[] = [];
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

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
        products={filteredProducts}
        viewMode={viewMode}
        query={searchQuery}
        wishlist={wishlist}
        onToggleWishlist={toggleWishlist}
        onSelect={addRecentlyViewed}
      />

      {/* ─── 페이지네이션 ───────────────────────────────── */}
      {totalPages > 1 && (
        <nav className="pagination">
          <button onClick={() => onPageChange(1)} disabled={page === 1} aria-label="첫 페이지">
            «
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label="이전 페이지"
          >
            ‹
          </button>
          {pageNumbers.map((p) => (
            <button key={p} className={p === page ? "active" : ""} onClick={() => onPageChange(p)}>
              {p}
            </button>
          ))}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            aria-label="다음 페이지"
          >
            ›
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            aria-label="마지막 페이지"
          >
            »
          </button>
        </nav>
      )}

      {/* ─── 백그라운드 로딩 인디케이터 ─────────────────── */}
      {isLoading && products.length > 0 && (
        <div className="background-loading">데이터 갱신 중...</div>
      )}
    </div>
  );
}
