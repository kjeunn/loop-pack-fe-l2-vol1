"use client";

import { useRouter } from "next/navigation";

import { useLogout } from "@/features/auth/api/mutations";

export function LogoutButton() {
  const router = useRouter();
  const logout = useLogout();

  const handleClick = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        // 보호 페이지에 있었을 수 있으니 홈으로 보내고, 서버 파생 상태(헤더 로그인 등)를 갱신한다.
        router.replace("/");
        router.refresh();
      },
    });
  };

  return (
    <button type="button" onClick={handleClick} disabled={logout.isPending}>
      {logout.isPending ? "로그아웃 중…" : "로그아웃"}
    </button>
  );
}
