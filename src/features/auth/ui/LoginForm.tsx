"use client";

import { useEffect, useState } from "react";

import { identify } from "@/analytics/logger";
import { trackEvent } from "@/analytics/schema";
import { setAnalyticsUser } from "@/analytics/session";
import { useLogin } from "@/features/auth/api/mutations";
import { safeRedirect } from "@/shared/lib/safeRedirect";
import buttonStyles from "@/shared/ui/button.module.css";
import { LoadingDots } from "@/shared/ui/loading-dots/LoadingDots";

import styles from "./LoginForm.module.css";

type LoginFormProps = {
  // proxy가 실어 보낸 원래 경로. 소비 시점에 safeRedirect로 다시 검증한다.
  redirect: string | null;
};

export function LoginForm({ redirect }: LoginFormProps) {
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 로그인 화면 진입을 1회 기록한다. from은 어디서 왔는지 — 보호 경로 리다이렉트면 그 경로, 아니면 direct.
  useEffect(() => {
    trackEvent("login_start", { from: redirect ?? "direct" });
  }, [redirect]);

  // 성공 후에도 화면 전환(soft navigation)이 끝날 때까지 로딩을 유지한다.
  // isPending만 쓰면 성공 직후 전환 전에 버튼이 잠깐 "로그인"으로 되돌아가 번쩍인다.
  const isLoading = login.isPending || login.isSuccess;

  const submit = () => {
    login.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          // 세션 반영(AnalyticsSessionSync)은 hard navigation 뒤 다음 문서에서 일어나므로, 이 문서에서
          // 찍는 login_success엔 응답의 user.id를 먼저 실어야 한다. 시드의 login_success는 전량 userId를 갖는다(퍼널 join 키).
          setAnalyticsUser(data.user.id);
          identify(data.user.id);
          trackEvent("login_success", { from: redirect ?? "direct" });
          // 인증 경계를 넘는 이동은 hard navigation(전체 페이지 로드)으로 한다 — 세션 만료 경로와 같은 방식.
          // soft navigation(router)은 비로그인 때 프리페치된 보호 경로의 307이 라우터 캐시에 남아 복원을 가로챈다(재현 E2E).
          // 전체 로드는 그 캐시를 거치지 않고, 새 쿠키로 서버 상태(헤더 로그인 등)도 새로 그려 refresh가 필요 없다.
          // redirect는 신뢰할 수 없으므로 여기서 다시 검증한다(오픈 리다이렉트 방어).
          window.location.assign(safeRedirect(redirect));
        },
        onError: (error) => {
          trackEvent("login_fail", { reason: error.message });
        },
      },
    );
  };

  return (
    // onSubmit을 인라인해 event 타입을 추론시킨다(React 19에서 FormEvent는 deprecated).
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {/* 라벨 텍스트 대신 placeholder로 보이되, aria-label로 접근성 이름을 남긴다(입력 중에도 유지). */}
      <input
        className={styles.input}
        type="email"
        aria-label="이메일"
        placeholder="이메일"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
      />
      <input
        className={styles.input}
        type="password"
        aria-label="비밀번호"
        placeholder="비밀번호"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        required
      />
      {login.isError && (
        <p role="alert" className={styles.error}>
          {login.error?.message}
        </p>
      )}
      <button
        type="submit"
        className={buttonStyles.primary}
        disabled={isLoading}
        aria-label={isLoading ? "로그인 중" : undefined}
      >
        {isLoading ? <LoadingDots /> : "로그인"}
      </button>
    </form>
  );
}
