// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: "vitest",
  // pnpm의 엄격한 node_modules 구조에서 Stryker가 러너 플러그인 자동탐색에 실패한다.
  // ("Cannot find TestRunner plugin 'vitest'") 그래서 명시적으로 로드한다.
  plugins: ["@stryker-mutator/vitest-runner"],
  // 변형 하나당 그 코드를 덮는 테스트만 돌려(전수 대신) 시간을 줄인다.
  coverageAnalysis: "perTest",
  // 변형 대상은 1단계에서 단위로 분류한 순수 로직만. 통합·E2E가 걸리는 컴포넌트 파일까지 넣으면
  // 변형 하나당 렌더·MSW 왕복을 다시 돌려 전수 변형이 끝나지 않는다. 그래서 여기로 한정한다.
  mutate: [
    "src/features/products/model/searchParams.ts", // parseAsPage 경계
    "src/features/products/api/queries.ts", // 조회 키 조립·정규화
    "src/entities/cart/model/cartStore.ts", // 장바구니 리듀서
    "src/entities/wishlist/model/wishlistStore.ts", // 위시리스트 리듀서
    "src/shared/api/queryClient.ts", // retry·throwOnError 술어
    "src/shared/api/apiError.ts", // isServerError 술어
  ],
  reporters: ["clear-text", "progress"],
};

export default config;
