import type { CategoryId, ProductSort } from "@/entities/product/model/types";
import { PAGE_SIZE_VALUES } from "@/features/products/model/pagination";

// 필터 드롭다운의 표시 텍스트.
// satisfies는 각 value가 유효한 타입인지만 검증하고 모든 값을 덮었는지는 강제하지 않으니,
// 정렬·카테고리 값을 추가하면 라벨도 함께 챙긴다.
export const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "popular", label: "인기순" },
  { value: "price-asc", label: "낮은 가격순" },
  { value: "price-desc", label: "높은 가격순" },
] as const satisfies readonly { value: ProductSort; label: string }[];

export const CATEGORY_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "casual", label: "캐주얼" },
  { value: "fashion", label: "패션" },
  { value: "goods", label: "뷰티·잡화" },
  { value: "home", label: "홈" },
  { value: "digital", label: "디지털" },
] as const satisfies readonly { value: CategoryId | "all"; label: string }[];

// 라벨이 값에서 그대로 나오므로 목록을 따로 두지 않고 파서가 쓰는 값에서 만든다.
export const PAGE_SIZE_OPTIONS = PAGE_SIZE_VALUES.map((value) => ({
  value,
  label: `${value}개씩`,
}));
