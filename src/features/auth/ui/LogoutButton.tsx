"use client";

import { useRouter } from "next/navigation";

import { useLogout } from "@/features/auth/api/mutations";
import { LoadingDots } from "@/shared/ui/loading-dots/LoadingDots";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
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

  // 성공 후에도 헤더가 로그아웃 상태로 다시 그려질 때까지 로딩을 유지해 "로그아웃" 번쩍임을 막는다.
  const isLoggingOut = logout.isPending || logout.isSuccess;

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={handleClick}
        disabled={isLoggingOut}
        aria-label={isLoggingOut ? "로그아웃 중" : undefined}
      >
        {isLoggingOut ? <LoadingDots /> : "로그아웃"}
      </button>
      {/* 실패해도 상태는 안전하다(서버 세션이 남아 화면도 로그인 유지). 다만 조용히 되돌아오면
          사용자가 실패를 모른 채 다시 눌러야 하므로 알린다. */}
      {logout.isError && <span role="alert">로그아웃에 실패했습니다. 다시 시도해 주세요.</span>}
    </>
  );
}
