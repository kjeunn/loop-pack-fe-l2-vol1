import type { ComponentProps, ReactNode } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

import { makeQueryClient } from "@/shared/api/queryClient";

// 실제 throwOnError·retry 정책은 makeQueryClient에 있으므로 그대로 쓰고,
// 테스트에선 재시도 지연만 없애 결과를 일정하게 만든다(재시도 규칙 자체는 queryClient.test가 단위로 검증).
// retry를 실제 정책(네트워크 1회)으로 되돌린다면, 파일이 끝난 뒤 도착하는 재시도 때문에
// 테스트는 다 통과했는데 파일만 실패로 잡힐 수 있다. 그땐 afterEach에서 cancelQueries()로 예약된 조회를 취소한다.
export function makeTestQueryClient() {
  const client = makeQueryClient();
  const defaults = client.getDefaultOptions();
  client.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retry: false } });
  return client;
}

// onUrlUpdate 타입은 어댑터 props에서 그대로 끌어와, nuqs 버전이 바뀌어도 어긋나지 않게 한다.
type OnUrlUpdate = NonNullable<ComponentProps<typeof NuqsTestingAdapter>["onUrlUpdate"]>;

type RenderOptions = {
  searchParams?: Record<string, string>;
  onUrlUpdate?: OnUrlUpdate;
};

// 통합 테스트의 공통 준비를 한 곳에 모은다 — URL 상태(nuqs)와 조회 캐시(QueryClient) 프로바이더.
// 무엇을 렌더할지·URL을 캡처할지 같은 파일별 차이는 호출부가 인자로 정한다.
// 이름을 `render`가 아니라 `renderWithProviders`로 둔다.
// @testing-library/react의 `render`와 겹쳐 헷갈리는 걸 피하고, 프로바이더로 감싼다는 의도를 드러낸다.
export function renderWithProviders(
  ui: ReactNode,
  { searchParams, onUrlUpdate }: RenderOptions = {},
) {
  const client = makeTestQueryClient();
  const result = render(
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </NuqsTestingAdapter>,
  );
  return { ...result, client };
}
