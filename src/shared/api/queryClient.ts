import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";

import { isServerError } from "@/shared/api/apiError";

// 서버 프리패치와 클라이언트 Provider가 같은 기본값으로 QueryClient를 만든다.
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 하이드레이션 직후 곧바로 다시 조회하지 않도록 기본 staleTime을 둔다.
        // 각 queryOptions 팩토리가 필요하면 이 값을 덮어쓴다.
        staleTime: 1000 * 60,
        // 전파 정책을 한 곳에 둔다. 5xx·예상 밖 서버 오류만 경계로 던지고,
        // 4xx·네트워크·빈 결과는 false라 화면 안에서 isError로 처리된다.
        // 예외가 필요한 쿼리만 각 useQuery에서 throwOnError를 덮어쓴다.
        throwOnError: (error) => isServerError(error),
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
