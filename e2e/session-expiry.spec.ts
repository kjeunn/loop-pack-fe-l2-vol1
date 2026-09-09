import { createSessionToken } from "@/app/api/_data/auth";
import { SESSION_TTL_SECONDS } from "@/app/api/_data/auth-cookies";

import { expect, test } from "./auth-fixtures";

// 세션 만료는 "이미 로그인된 세션이 만료됨"이라 로그인 검증이 아니다.
// 그래서 로그인 폼을 다시 채우지 않고 storageState(워커 인증 fixture)를 재사용하고,
// 시간 대신 scenario=expired 쿠키로 재현한다(쿠키가 유효해도 보호 자원이 항상 401).
test("세션이 만료되면 보호 경로에서 원래 경로를 싣고 로그인으로 유도된다", async ({
  page,
  context,
  baseURL,
}) => {
  // 쿠키 도메인은 baseURL에서 얻는다 — E2E_BASE_URL로 다른 호스트를 가리켜도 쿠키가 따라간다.
  await context.addCookies([{ name: "scenario", value: "expired", url: baseURL }]);

  await page.goto("/orders");

  // 보호 쿼리(meta.auth) 401 → 전역 핸들러가 location.assign으로 원래 경로를 싣고 로그인으로 이동한다.
  // 이 redirect 값이 복원 테스트가 되돌릴 바로 그 기준값이다. 진입 시 만료(proxy)와 같은 reason이 붙는다.
  await expect(page).toHaveURL(/\/login\?redirect=%2Forders&reason=expired/);
  await expect(page.getByRole("status")).toHaveText(/만료/);
});

// scenario=expired는 쿠키가 유효한 채 API만 401이라 "진행 중 만료"만 본다.
// 실제 만료(서명은 맞고 TTL이 지난 쿠키)는 proxy가 쿠키를 검증해 진입 시 튕기는 다른 경로라 따로 재현한다.
// 저장된 로그인 상태를 깔면 안 되므로 빈 컨텍스트로 시작한다.
test.describe("실제 만료 쿠키", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("만료된 쿠키로 보호 경로에 들어가면 원래 경로를 싣고 로그인으로 유도된다", async ({
    page,
    context,
    baseURL,
  }) => {
    // 서명이 유효한 만료 토큰은 구현 없이 만들 수 없어 이 한 곳만 구현을 import한다.
    // (URL·파라미터 같은 사용자 계약은 e2e가 리터럴로 둔다 — 이 원칙의 예외다.)
    const expiredToken = createSessionToken("u1", Date.now() - (SESSION_TTL_SECONDS + 60) * 1_000);
    await context.addCookies([{ name: "session", value: expiredToken, url: baseURL }]);

    await page.goto("/orders");

    // 쿠키가 없던 미로그인과 달리 "만료·위조"라 reason이 붙는다.
    await expect(page).toHaveURL(/\/login\?redirect=%2Forders&reason=expired/);
    await expect(page.getByRole("status")).toHaveText(/만료/);
  });
});
