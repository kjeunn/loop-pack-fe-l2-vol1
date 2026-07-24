import type { ApiErrorResponse } from "@/types/commerce";

// 브라우저는 상대경로로 fetch할 수 있지만, 서버 프리패치는 절대 URL이 필요하다.
// 프로덕션은 NEXT_PUBLIC_BASE_URL을 두고, 없으면 로컬 개발 기본값을 쓴다.
function resolveUrl(path: string): string {
  if (typeof window !== "undefined") {
    return path;
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return `${baseUrl}${path}`;
}

// 클라이언트 조회 계층. mock API는 실패 시 ApiErrorResponse(message)를 400/500으로 준다.
// 실패를 throw로 바꿔 TanStack Query의 isError·error.message로 흘려보낸다.
// no-store는 서버 프리패치가 자기 API를 부를 때 이 라우트를 매 요청 렌더로 만들어,
// 빌드 타임에 빈 데이터가 구워지는 것을 막는다. 클라이언트 캐싱은 React Query가 맡는다.
export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(resolveUrl(path), { cache: "no-store" });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new Error(error?.message ?? "요청을 처리하지 못했습니다.");
  }

  return response.json() as Promise<T>;
}
