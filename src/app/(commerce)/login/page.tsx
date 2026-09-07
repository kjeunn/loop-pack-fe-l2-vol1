import { LoginForm } from "@/features/auth/ui/LoginForm";
import styles from "@/shared/ui/focused-page.module.css";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// 공개 경로(proxy 매처 밖). proxy가 실어 보낸 redirect를 읽어 폼에 넘긴다.
// 검증은 폼이 로그인 성공 시 safeRedirect로 하므로 여기선 문자열 추출만 한다.
// reason=expired는 proxy가 "쿠키는 있었는데 만료·위조"일 때만 붙인다 — 로그인한 적 없는 사람에겐 안 뜬다.
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirect = typeof params.redirect === "string" ? params.redirect : null;
  const isExpired = params.reason === "expired";

  return (
    <section className={styles.page}>
      <h1>로그인</h1>
      {isExpired && <p role="status">세션이 만료되었습니다. 다시 로그인해 주세요.</p>}
      <LoginForm redirect={redirect} />
    </section>
  );
}
