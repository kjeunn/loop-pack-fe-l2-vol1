import { useEffect, useState } from "react";

import { ProductGrid } from "./components/ProductGrid";
import { CATEGORIES, PAGE_SIZE, SORT_OPTIONS } from "./constants";
import { useProductQuery } from "./hooks/useProductQuery";
import { useProducts } from "./hooks/useProducts";
import { useRecentlyViewed } from "./hooks/useRecentlyViewed";
import { useUrlQuerySync } from "./hooks/useUrlQuerySync";
import { useWishlist } from "./hooks/useWishlist";
import type { SortBy } from "./types";

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
      <section className="filter-panel">
        <div className="filter-group">
          <label>카테고리</label>
          <div className="category-list">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={category === cat.value ? "active" : ""}
                onClick={() => onCategoryChange(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>가격 범위</label>
          <div className="price-range">
            <input
              type="number"
              placeholder="최소"
              value={minPrice}
              onChange={(e) =>
                onMinPriceChange(e.target.value === "" ? "" : Number(e.target.value))
              }
              min={0}
            />
            <span>~</span>
            <input
              type="number"
              placeholder="최대"
              value={maxPrice}
              onChange={(e) =>
                onMaxPriceChange(e.target.value === "" ? "" : Number(e.target.value))
              }
              min={0}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>옵션</label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 400,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => onInStockOnlyChange(e.target.checked)}
            />
            재고 있는 것만
          </label>
        </div>

        <button className="reset-button" onClick={onResetFilters}>
          필터 초기화
        </button>
      </section>

      {/* ─── 검색 + 정렬 + 보기 모드 ───────────────────── */}
      <section className="search-sort">
        <input
          type="search"
          placeholder="상품 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        <select value={sortBy} onChange={(e) => onSortChange(e.target.value as SortBy)}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select value={viewMode} onChange={(e) => setViewMode(e.target.value as "grid" | "list")}>
          <option value="grid">그리드</option>
          <option value="list">리스트</option>
        </select>
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
