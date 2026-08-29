"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useLogin } from "@/features/auth/api/mutations";
import { safeRedirect } from "@/shared/lib/safeRedirect";

type LoginFormProps = {
  // proxy가 실어 보낸 원래 경로. 소비 시점에 safeRedirect로 다시 검증한다.
  redirect: string | null;
};

export function LoginForm({ redirect }: LoginFormProps) {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = () => {
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          // 서버 파생 상태(헤더 로그인 등)를 갱신하고 원래 경로로 돌린다.
          // redirect는 신뢰할 수 없으므로 여기서 다시 검증한다(오픈 리다이렉트 방어).
          router.replace(safeRedirect(redirect));
          router.refresh();
        },
      },
    );
  };

  return (
    // onSubmit을 인라인해 event 타입을 추론시킨다(React 19에서 FormEvent는 deprecated).
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label>
        이메일
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </label>
      <label>
        비밀번호
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {login.isError && <p role="alert">{login.error?.message}</p>}
      <button type="submit" disabled={login.isPending}>
        {login.isPending ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}
