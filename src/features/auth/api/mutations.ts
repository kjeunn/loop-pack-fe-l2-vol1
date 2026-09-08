import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { SessionUser } from "@/entities/session/model/types";
import { fetchJson } from "@/shared/api/fetcher";

// 인증 요청 계약(클라 몫). 서버(app)의 타입은 features가 올려다볼 수 없어 여기서 정의한다.
export type LoginInput = { email: string; password: string };
type LoginResult = { user: SessionUser };

// 로그인·로그아웃은 각자 POST 한 번뿐이라 한 파일에 둔다(queries.ts와 같은 결).
// 성공 뒤 화면 전환은 호출 컴포넌트가 맡는다(로그인은 hard navigation, 로그아웃은 router).
export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) =>
      fetchJson<LoginResult>("/api/auth/login", { method: "POST", body: input }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetchJson<void>("/api/auth/logout", { method: "POST" }),
    // 로그아웃한 사용자의 보호 자원 캐시를 메모리에서 지운다. 키가 사용자별이라 다음 사용자에게 섞이진 않지만,
    // 공용 PC에서 남의 데이터를 gcTime 동안 들고 있을 이유가 없다.
    // 장바구니·위시리스트는 비회원 자산이라 건드리지 않는다.
    // 정합성이라 mutate 레벨이 아니라 여기(언마운트돼도 돈다).
    onSuccess: () => {
      queryClient.removeQueries({ predicate: (query) => query.meta?.auth === true });
    },
  });
}
