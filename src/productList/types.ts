// [분리 근거] 도메인 데이터 형태 정의. UI·hooks·services가 모두 공유하므로
// 특정 레이어에 두면 의존 방향이 꼬인다 → 어느 레이어도 아닌 최하위 타입 모듈로 분리.
export type Category = "electronics" | "fashion" | "home" | "beauty";

// 카테고리 필터 값: 실제 카테고리 + 전체("all")
export type CategoryValue = "all" | Category;

export type Product = {
  id: number;
  name: string;
  category: Category;
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl: string;
  createdAt: string;
  rating: number;
  reviewCount: number;
};

export type ProductListResponse = {
  products: Product[];
  totalCount: number;
};

export type SortBy = "latest" | "popular" | "price-asc" | "price-desc";
