import { expect, type Page, test } from "@playwright/test";

// 로그인 자체(폼 제출·복원·자격 오류)를 검증하므로 storageState를 쓰지 않는다.
// 이미 로그인된 상태로 시작하면 로그인 폼도, 미로그인→복원 흐름도 볼 수 없기 때문이다.
// 그래서 이 파일은 워커 인증 fixture가 아니라 기본 test(빈 컨텍스트)를 쓴다.
// (세션 만료는 "이미 로그인된 세션의 만료"라 로그인 검증이 아니므로 session-expiry.spec.ts에서 storageState로 다룬다.)

// 계정을 워커별로 가르지 않고 looper1을 직접 쓴다. order.spec의 워커0도 looper1을 쓰지만,
// 이 파일은 주문을 만들지 않아 서버 상태가 안 쌓이고 복원 테스트도 주문 내용을 단언하지 않아,
// 계정을 공유해도 충돌하지 않는다. 여기에 주문 생성·내역 검증을 더하면 그때 격리가 필요해진다.
const ACCOUNT = "looper1@loopers.dev";
const PASSWORD = "looper1234";

async function fillLogin(page: Page) {
  await page.getByLabel("이메일").fill(ACCOUNT);
  await page.getByLabel("비밀번호").fill(PASSWORD);
  // 헤더에도 "로그인" 링크가 있으나 role이 link라, 폼 제출 버튼(button)만 집힌다.
  await page.getByRole("button", { name: "로그인" }).click();
}

test.describe("인증 플로우", () => {
  test("미로그인으로 보호 경로에 들어가면 로그인 후 원래 경로로 복원된다", async ({ page }) => {
    await page.goto("/orders");
    // proxy가 로그인으로 돌리고 원래 경로를 redirect로 싣는다(복원의 기준값).
    await expect(page).toHaveURL(/\/login\?redirect=%2Forders/);

    await fillLogin(page);

    // 복원은 앱이 스스로 한다(LoginForm onSuccess의 router.replace(safeRedirect)) — 수동 goto 없이 URL이 돌아온다.
    await expect(page).toHaveURL(/\/orders/);
    // 게이트가 실제로 열렸다: 로그인 상태가 헤더에 반영되고, 로그인 폼으로 다시 튕기지 않았다.
    await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
    await expect(page.getByLabel("비밀번호")).toHaveCount(0);

    // 브라우저가 저장한 세션 쿠키의 속성. 라우트 테스트는 서버가 Set-Cookie를 "보냈다"까지만 보고,
    // 브라우저가 그 속성을 실제로 반영했는지는 여기서만 본다. secure는 로컬 서버가 HTTP라 false여서
    // 운영 HTTPS의 Secure를 보증하지 못하므로 단언하지 않는다.
    const session = (await page.context().cookies()).find((cookie) => cookie.name === "session");
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe("Lax");
    expect(session?.path).toBe("/");
    // httpOnly의 뜻: 스크립트가 못 읽는다(XSS로 세션 탈취 불가).
    expect(await page.evaluate(() => document.cookie)).not.toContain("session=");
  });

  test("proxy는 미로그인 보호 경로 요청에 307과 로그인 Location을 직접 돌려준다", async ({
    request,
  }) => {
    // 브라우저가 리다이렉트를 따라가기 전의 응답을 그대로 본다 — proxy 배선을 다른 코드를 거치지 않고 확인하는
    // 유일한 지점이다(유닛은 함수만 불러 matcher를 못 보고, 페이지 이동 단언은 결과만 본다).
    const response = await request.get("/orders", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toContain("/login?redirect=%2Forders");
  });

  test("초기 HTML만으로 로그인 상태가 보인다 — JavaScript 없이", async ({ page, browser }) => {
    // 로그인 상태를 만든 뒤, JavaScript를 끈 컨텍스트로 같은 쿠키를 들고 연다.
    // 하이드레이션 뒤 DOM이 아니라 서버가 그린 HTML에 로그인 상태가 있어야 한다(SSR 단일 소스).
    await page.goto("/login");
    await fillLogin(page);
    await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
    const storageState = await page.context().storageState();

    const noScript = await browser.newContext({ javaScriptEnabled: false, storageState });
    const staticPage = await noScript.newPage();
    await staticPage.goto("/orders");
    await expect(staticPage.getByText("루퍼1")).toBeVisible();
    await expect(staticPage.getByRole("button", { name: "로그아웃" })).toBeVisible();
    await expect(staticPage.getByRole("link", { name: "로그인" })).toHaveCount(0);
    await noScript.close();

    // 반대 방향: 쿠키 없는 no-JS 문서엔 로그인 링크가 있고 로그아웃은 없다.
    const anonymous = await browser.newContext({ javaScriptEnabled: false });
    const anonymousPage = await anonymous.newPage();
    await anonymousPage.goto("/");
    await expect(anonymousPage.getByRole("link", { name: "로그인" })).toBeVisible();
    await expect(anonymousPage.getByRole("button", { name: "로그아웃" })).toHaveCount(0);
    await anonymous.close();
  });

  test("비로그인의 보호 경로 링크는 프리페치되지 않고, 그 링크를 거쳐 로그인하면 원래 경로로 복원된다", async ({
    page,
  }) => {
    // 장바구니가 공개 화면이라 비로그인 사용자도 "주문서로 이동" Link를 본다. 이 링크가 프리페치되면
    // proxy의 307이 라우터 캐시에 남아 복원을 가로챘다(재현했던 결함). 지금은 두 겹으로 막는다 —
    // 링크는 프리페치하지 않고(캐시에 307이 생기지 않음), 복원은 hard navigation이라 라우터 캐시를 거치지 않는다.
    // 캐시된 307은 이제 UI로 만들 수 없으므로, 여기선 "프리페치 안 됨"과 "그 경로로 복원됨"을 고정한다.
    await page.goto("/");
    await page.evaluate(() =>
      localStorage.setItem("cart", JSON.stringify({ state: { cartIds: ["p1"] }, version: 1 })),
    );
    const orderFormRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/order-form")) {
        orderFormRequests.push(request.url());
      }
    });

    await page.goto("/cart");
    const link = page.getByRole("link", { name: "주문서로 이동" });
    await expect(link).toBeVisible();
    // 프리페치는 뷰포트 진입 직후 나간다. 네트워크가 잠잠해질 때까지 기다린 뒤 한 건도 없어야 한다.
    await page.waitForLoadState("networkidle");
    expect(orderFormRequests).toEqual([]);

    await link.click();
    await expect(page).toHaveURL(/\/login\?redirect=%2Forder-form/);

    await fillLogin(page);

    await expect(page).toHaveURL(/\/order-form/);
    await expect(page.getByRole("button", { name: "주문하기" })).toBeVisible();
  });

  test("자격 증명이 틀리면 에러를 보이고 이동하지 않는다", async ({ page, context }) => {
    // invalid 시나리오면 자격이 맞아도 항상 401이라, 틀린 비밀번호 없이 실패 경로를 결정적으로 재현한다.
    await context.addCookies([
      { name: "scenario", value: "invalid", url: "http://localhost:3000" },
    ]);

    await page.goto("/login");
    await fillLogin(page);

    // alert은 main 안으로 좁힌다(Next 라우트 어나운서가 body 직속의 role=alert라, 앱 에러 alert만 남긴다).
    await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
    // 실패했으니 로그인 화면에 그대로 머문다.
    await expect(page).toHaveURL(/\/login/);
  });
});
