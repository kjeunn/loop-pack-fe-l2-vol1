import type { ApiErrorResponse } from "@/types/commerce";

// 클라이언트 조회 계층. mock API는 실패 시 ApiErrorResponse(message)를 400/500으로 준다.
// 실패를 throw로 바꿔 TanStack Query의 isError·error.message로 흘려보낸다.
// 서버 프리패치(Advanced B)를 붙이면 상대경로 fetch가 안 되므로 절대 base가 필요하다.
export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new Error(error?.message ?? "요청을 처리하지 못했습니다.");
  }

  return response.json() as Promise<T>;
}
