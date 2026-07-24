import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";

// 서버 프리패치와 클라이언트 Provider가 같은 기본값으로 QueryClient를 만든다.
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 하이드레이션 직후 곧바로 다시 조회하지 않도록 기본 staleTime을 둔다.
        // 각 queryOptions 팩토리가 필요하면 이 값을 덮어쓴다.
        staleTime: 1000 * 60,
      },
      dehydrate: {
        // 기본은 성공한 쿼리만 직렬화한다.
        // pending까지 포함하면 await 없이 시작만 한 프리패치를 스트리밍으로 이어줄 수 있다.
        // await하는 쿼리에는 영향이 없다.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}
