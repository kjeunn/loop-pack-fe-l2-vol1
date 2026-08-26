// 파서 정의는 nuqs/server에서 가져온다. client 훅(useQueryStates)은 nuqs에서 오지만,
// 이 파서 객체는 서버 page의 loader·serializer도 재사용하므로 client 전용 진입점을 타면 안 된다
// (createParser를 "nuqs"에서 가져오면 서버 평가에서 "createParser on the client"로 빌드가 깨진다).
import {
  createLoader,
  createParser,
  createSerializer,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

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
// parse()의 거르기(0·음수·소수·문자→null)를 단위 테스트에서 격리해 확인하려고 export한다.
export const parseAsPage = createParser({
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

// 서버 page.tsx가 searchParams를 같은 파서로 읽고(같은 캐시 키), redirect URL도 같은 규칙으로 만든다.
export const loadProductListSearchParams = createLoader(productSearchParsers);
export const serializeProductListSearchParams = createSerializer(productSearchParsers);
