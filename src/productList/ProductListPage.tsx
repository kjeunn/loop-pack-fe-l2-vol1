import { useEffect, useState } from "react";

import { CATEGORIES, PAGE_SIZE, SORT_OPTIONS } from "./constants";
import { useProducts } from "./hooks/useProducts";
import { useRecentlyViewed } from "./hooks/useRecentlyViewed";
import { useUrlQuerySync } from "./hooks/useUrlQuerySync";
import { useWishlist } from "./hooks/useWishlist";
import type { CategoryValue, SortBy } from "./types";
import { formatPrice } from "./utils/formatPrice";
import { getProductBadges } from "./utils/productBadges";

import "./ProductListPage.css";

// 검색어를 정규식에 안전하게 넣기 위한 escape (특수문자로 인한 RegExp 크래시 방지)
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function ProductListPage() {
  // ─── 필터 상태 ──────────────────────────────────────────
  const [category, setCategory] = useState<CategoryValue>("all");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<SortBy>("latest");

  // ─── 검색 상태 ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ─── 페이지네이션 상태 ──────────────────────────────────
  const [page, setPage] = useState(1);

  // ─── 옵션 토글 ──────────────────────────────────────────
  const [inStockOnly, setInStockOnly] = useState(false);
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

  const handleCategoryChange = (cat: CategoryValue) => {
    setCategory(cat);
    setPage(1);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setMinPrice(v === "" ? "" : Number(v));
    setPage(1);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setMaxPrice(v === "" ? "" : Number(v));
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortBy);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleInStockToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInStockOnly(e.target.checked);
    setPage(1);
  };

  const handlePageChange = (next: number) => {
    setPage(next);
  };

  const handleResetFilters = () => {
    setCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("latest");
    setSearchQuery("");
    setInStockOnly(false);
    setPage(1);
  };

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
                onClick={() => handleCategoryChange(cat.value)}
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
              onChange={handleMinPriceChange}
              min={0}
            />
            <span>~</span>
            <input
              type="number"
              placeholder="최대"
              value={maxPrice}
              onChange={handleMaxPriceChange}
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
            <input type="checkbox" checked={inStockOnly} onChange={handleInStockToggle} />
            재고 있는 것만
          </label>
        </div>

        <button className="reset-button" onClick={handleResetFilters}>
          필터 초기화
        </button>
      </section>

      {/* ─── 검색 + 정렬 + 보기 모드 ───────────────────── */}
      <section className="search-sort">
        <input
          type="search"
          placeholder="상품 검색..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
        <select value={sortBy} onChange={handleSortChange}>
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
      <section
        className="product-grid"
        style={viewMode === "list" ? { gridTemplateColumns: "1fr" } : undefined}
      >
        {filteredProducts.length === 0 ? (
          <div className="empty">조건에 맞는 상품이 없습니다.</div>
        ) : (
          filteredProducts.map((product) => {
            // ─── 검색어 하이라이팅 로직 인라인 ──────────
            const highlightMatch = (text: string) => {
              if (!searchQuery) return <>{text}</>;
              const parts = text.split(new RegExp(`(${escapeRegExp(searchQuery)})`, "gi"));
              return (
                <>
                  {parts.map((part, i) =>
                    part.toLowerCase() === searchQuery.toLowerCase() ? (
                      <mark key={i} style={{ background: "#fff176", padding: 0 }}>
                        {part}
                      </mark>
                    ) : (
                      part
                    ),
                  )}
                </>
              );
            };

            const badges = getProductBadges(product);
            const formattedPrice = formatPrice(product.price);
            const formattedOriginal = product.originalPrice
              ? formatPrice(product.originalPrice)
              : null;
            const isWished = wishlist.includes(product.id);

            return (
              <article
                key={product.id}
                className="product-card"
                onClick={() => addRecentlyViewed(product.id)}
              >
                <div className="image-wrap">
                  <img src={product.imageUrl} alt={product.name} loading="lazy" />
                  {badges.discountRate > 0 && (
                    <span className="badge badge-discount">{badges.discountRate}% 할인</span>
                  )}
                  {badges.isNew && <span className="badge badge-new">NEW</span>}
                  {badges.isHot && <span className="badge badge-hot">특가</span>}
                  {badges.isBest && <span className="badge badge-best">BEST</span>}
                  {badges.isSoldOut && <span className="badge badge-soldout">품절</span>}
                  {!badges.isSoldOut && badges.isAlmostSoldOut && (
                    <span className="badge badge-warning">품절 임박</span>
                  )}
                </div>

                <div className="card-body">
                  <h3 className="product-name">{highlightMatch(product.name)}</h3>
                  <div className="price-area">
                    {formattedOriginal && (
                      <span className="original-price">{formattedOriginal}</span>
                    )}
                    <span className="price">{formattedPrice}</span>
                    {badges.isFreeShipping && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: "#2e7d32",
                          fontWeight: 600,
                        }}
                      >
                        무료배송
                      </span>
                    )}
                  </div>
                  <div className="rating-area">
                    <span className="rating">★ {product.rating.toFixed(1)}</span>
                    <span className="review-count">({product.reviewCount.toLocaleString()})</span>
                    <button
                      style={{
                        marginLeft: "auto",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 16,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      aria-label="위시리스트 토글"
                    >
                      {isWished ? "♥" : "♡"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* ─── 페이지네이션 ───────────────────────────────── */}
      {totalPages > 1 && (
        <nav className="pagination">
          <button onClick={() => handlePageChange(1)} disabled={page === 1} aria-label="첫 페이지">
            «
          </button>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            aria-label="이전 페이지"
          >
            ‹
          </button>
          {pageNumbers.map((p) => (
            <button
              key={p}
              className={p === page ? "active" : ""}
              onClick={() => handlePageChange(p)}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            aria-label="다음 페이지"
          >
            ›
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
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
