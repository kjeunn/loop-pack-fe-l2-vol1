import { createParser, parseAsNumberLiteral, parseAsString, parseAsStringLiteral } from "nuqs";

import type { CategoryId, ProductSort } from "@/entities/product/model/types";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_VALUES } from "@/features/products/model/pagination";

export const CATEGORY_VALUES = [
  "all",
  "casual",
  "fashion",
  "goods",
  "home",
  "digital",
] as const satisfies readonly (CategoryId | "all")[];

export const SORT_VALUES = [
  "latest",
  "popular",
  "price-asc",
  "price-desc",
] as const satisfies readonly ProductSort[];

// API는 1 미만이거나 정수가 아닌 page를 400으로 막는다.
// 주소창에 직접 친 값도 여기서 걸러 잘못된 요청 자체를 만들지 않는다.
// null을 반환하면 nuqs가 withDefault 값으로 되돌린다.
const parseAsPage = createParser({
  parse: (value) => {
    const page = Number(value);
    return Number.isInteger(page) && page >= 1 ? page : null;
  },
  serialize: String,
});

// pageSize는 사용자가 화면에서 고르는 값이라 새로고침·공유에도 유지되도록 URL에 둔다.
// scenario는 mock API 검증 전용이라 사용자 URL 상태에 넣지 않는다.
export const productSearchParsers = {
  q: parseAsString.withDefault(""),
  category: parseAsStringLiteral(CATEGORY_VALUES).withDefault("all"),
  sort: parseAsStringLiteral(SORT_VALUES).withDefault("latest"),
  page: parseAsPage.withDefault(1),
  pageSize: parseAsNumberLiteral(PAGE_SIZE_VALUES).withDefault(DEFAULT_PAGE_SIZE),
};
