import { ApiError } from "@/shared/api/apiError";
import type { ServerRequestContext } from "@/shared/api/serverRequest";
import type { ApiErrorResponse } from "@/shared/api/types";
import { getAppOrigin } from "@/shared/config/origin";

// 브라우저는 상대경로로 fetch할 수 있지만, 서버 프리패치는 절대 URL이 필요하다.
// 서버에서는 들어온 요청의 origin을 쓴다 — 배포는 production 도메인과 preview 주소로 동시에 서빙되므로
// 값 하나로 고정하면 한쪽이 틀린다(serverRequest.ts에 근거).
// 요청 스코프 밖(vitest·스크립트)이면 APP_ORIGIN으로 돌아간다.
// serverRequest는 server-only라 동적 import로만 들어간다. 최상위에서 import하면 브라우저 번들이 깨진다.
async function readServerContext(): Promise<ServerRequestContext | null> {
  if (typeof window !== "undefined") {
    return null;
  }
  const { readServerRequestContext } = await import("@/shared/api/serverRequest");
  return readServerRequestContext();
}

// 클라이언트 조회 계층. 실패를 ApiError(kind·status)로 바꿔 TanStack Query로 흘려보낸다.
// 전역 throwOnError 정책이 kind·status를 보고 5xx는 경계로, 4xx·네트워크는 인라인으로 가른다.
// no-store는 서버 프리패치가 자기 API를 부를 때 이 라우트를 매 요청 렌더로 만들어,
// 빌드 타임에 빈 데이터가 구워지는 것을 막는다. 클라이언트 캐싱은 React Query가 맡는다.
type FetchOptions = {
  signal?: AbortSignal;
  method?: "GET" | "POST";
  // 있으면 JSON으로 직렬화해 보낸다(로그인 등). GET 기본에는 없다.
  body?: unknown;
};

export async function fetchJson<T>(path: string, options?: FetchOptions): Promise<T> {
  const hasBody = options?.body !== undefined;
  const isBrowser = typeof window !== "undefined";
  const server = await readServerContext();
  // 브라우저는 상대경로로 현재 origin을 그대로 쓴다.
  const url = isBrowser ? path : `${server?.origin ?? getAppOrigin()}${path}`;
  const headers: Record<string, string> = {};
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }
  // 인증 벽(Deployment Protection)이 걸린 배포에서는 이 쿠키가 있어야 self-fetch가 통과한다.
  if (server?.cookie) {
    headers.cookie = server.cookie;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options?.method ?? "GET",
      cache: "no-store",
      signal: options?.signal,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    // 취소(AbortError)는 그대로 던져 TanStack이 네트워크 실패가 아니라 취소로 인식하게 한다.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    // 그 외 fetch 거부는 네트워크 실패(오프라인 등)다. HTTP status가 없다.
    throw new ApiError("network", null, "네트워크 연결을 확인해 주세요.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new ApiError("http", response.status, body?.message ?? "요청을 처리하지 못했습니다.");
  }

  // 204(로그아웃)는 본문이 없어 json()이 실패하므로 그대로 반환한다.
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}
