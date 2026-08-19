import { expect, type Page, test } from "@playwright/test";

// URL 조건 복원과 store 유지는 브라우저 히스토리·라우터가 얽혀 jsdom에서 못 본다 → 진짜 브라우저로 확인한다.

// prefetch는 네트워크 동작이라 jsdom이 못 본다 → 실제 브라우저 요청을 가로채 검증한다.
// productListQueryOptions가 q·category·sort·page·pageSize를 모두 URL에 담으므로,
// 어느 조건의 몇 페이지를 요청했는지 searchParams로 정확히 가려낸다.
function captureListRequests(page: Page): URLSearchParams[] {
  const requests: URLSearchParams[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/products") {
      requests.push(url.searchParams);
    }
  });
  return requests;
}

test("뒤로·앞으로 가기로 목록 조건이 복원된다", async ({ page }) => {
  await page.goto("/products");

  const categorySelect = page.getByLabel("카테고리");
  await categorySelect.selectOption("fashion");
  await expect(page).toHaveURL(/category=fashion/);

  await categorySelect.selectOption("digital");
  await expect(page).toHaveURL(/category=digital/);

  // 뒤로 가면 직전 조건(fashion)으로 돌아오고, select 값도 그 조건을 반영한다.
  await page.goBack();
  await expect(page).toHaveURL(/category=fashion/);
  await expect(categorySelect).toHaveValue("fashion");

  // 앞으로 가면 다시 digital로.
  await page.goForward();
  await expect(page).toHaveURL(/category=digital/);
  await expect(categorySelect).toHaveValue("digital");
});

test("페이지를 오가도 담은 상태가 유지된다", async ({ page }) => {
  await page.goto("/products");

  const firstCart = page.getByRole("button", { name: /장바구니$/ }).first();
  await firstCart.click();
  await expect(firstCart).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/장바구니 1/)).toBeVisible();

  // 홈으로 갔다가 뒤로 돌아온다(클라이언트 이동).
  await page.getByRole("link", { name: "Commerce" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByText(/장바구니 1/)).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/products/);
  // 되돌아온 목록에서도 그 상품은 여전히 담긴 상태다.
  await expect(page.getByRole("button", { name: /장바구니$/ }).first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByText(/장바구니 1/)).toBeVisible();
});

test("새로고침해도 담은 상품이 복원된다", async ({ page }) => {
  await page.goto("/products");

  await page
    .getByRole("button", { name: /장바구니$/ })
    .first()
    .click();
  await expect(page.getByText(/장바구니 1/)).toBeVisible();

  // 전체 새로고침 후에도 localStorage에서 복원된다(Advanced A).
  await page.reload();
  await expect(page.getByText(/장바구니 1/)).toBeVisible();
  await expect(page.getByRole("button", { name: /장바구니$/ }).first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("URL로 직접 진입하면 조건이 복원된다", async ({ page }) => {
  await page.goto("/products?category=fashion&sort=price-asc");

  await expect(page.getByLabel("카테고리")).toHaveValue("fashion");
  await expect(page.getByLabel("정렬")).toHaveValue("price-asc");
});

test("새로고침해도 URL 필터가 유지된다", async ({ page }) => {
  await page.goto("/products?category=fashion&sort=price-asc");
  await expect(page.getByLabel("카테고리")).toHaveValue("fashion");

  await page.reload();

  // 필터는 URL에 있어 전체 새로고침 뒤에도 복원된다(장바구니 localStorage 복원과는 다른 경로다).
  await expect(page).toHaveURL(/category=fashion/);
  await expect(page).toHaveURL(/sort=price-asc/);
  await expect(page.getByLabel("카테고리")).toHaveValue("fashion");
  await expect(page.getByLabel("정렬")).toHaveValue("price-asc");
});

test("검색어를 바꾸면 결과가 필터되고, 없으면 빈 상태를 보여준다", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByText(/총 \d+개/)).toBeVisible();

  // 어떤 상품과도 안 맞는 검색어 → 빈 상태 문구.
  await page.getByPlaceholder("상품명 또는 브랜드").fill("존재하지않는상품zzz");
  await expect(page).toHaveURL(/q=/);
  await expect(page.getByText("조건에 맞는 상품이 없습니다.")).toBeVisible();
});

test("검색어를 치자마자 뒤로 가면 미완성 검색어가 URL에 새어나가지 않는다", async ({ page }) => {
  // 먼저 한 번 commit해 뒤로 갈 지점을 만든다.
  await page.goto("/products");
  const input = page.getByPlaceholder("상품명 또는 브랜드");
  await input.fill("니트");
  await expect(page).toHaveURL(/q=%EB%8B%88%ED%8A%B8/); // "니트" commit 확인

  // 이어서 "샵"을 더 치고 debounce(300ms)가 끝나기 전에 곧바로 뒤로 간다.
  await input.pressSequentially("샵");
  await page.goBack();

  // 죽은 타이머가 "니트샵"을 뒤늦게 push하면 안 된다. 시간이 지나도 URL에 "샵"이 없어야 한다.
  await page.waitForTimeout(500);
  await expect(page).not.toHaveURL(/%EC%83%B5/);
});

test("카테고리를 바꾸면 결과가 갱신되고 page가 1로 돌아간다", async ({ page }) => {
  await page.goto("/products");

  // 2페이지로 이동한 뒤 카테고리를 바꾸면 page가 1로 리셋된다.
  await page.getByRole("button", { name: "다음" }).click();
  await expect(page).toHaveURL(/page=2/);

  await page.getByLabel("카테고리").selectOption("fashion");
  await expect(page).toHaveURL(/category=fashion/);
  await expect(page).not.toHaveURL(/page=2/);
});

test("페이지네이션으로 다음·이전을 오간다", async ({ page }) => {
  await page.goto("/products");

  const pageIndicator = page.locator(".week05-pagination span");
  await expect(pageIndicator).toContainText("1 /");

  await page.getByRole("button", { name: "다음" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(pageIndicator).toContainText("2 /");

  await page.getByRole("button", { name: "이전" }).click();
  await expect(pageIndicator).toContainText("1 /");
});

test("진입만으로는 다음 페이지를 prefetch하지 않고, 다음 버튼에 hover하면 그때 prefetch한다", async ({
  page,
}) => {
  const requests = captureListRequests(page);
  await page.goto("/products");
  await expect(page.getByText(/총 30개/)).toBeVisible();

  // 모든 조회는 이벤트의 결과다. 페이지 진입만으론 다음 페이지를 투기적으로 받지 않는다.
  expect(requests.some((q) => q.get("page") === "2")).toBe(false);

  // "다음"에 마우스를 올리면 곧 누를 의도로 보고 그때 page=2를 미리 받는다.
  await page.getByRole("button", { name: "다음" }).hover();
  await expect.poll(() => requests.some((q) => q.get("page") === "2")).toBe(true);
});

test("마지막 페이지에서는 다음 버튼이 비활성이라 없는 페이지를 prefetch하지 않는다", async ({
  page,
}) => {
  const requests = captureListRequests(page);
  // 상품 30개·pageSize 12 → 전체 3페이지. 3페이지엔 다음이 없다.
  await page.goto("/products?page=3");
  await expect(page.locator(".week05-pagination span")).toContainText("3 / 3");

  // "다음"이 disabled라 hover·focus 이벤트가 뜨지 않아 없는 page=4를 요청할 수 없다.
  await expect(page.getByRole("button", { name: "다음" })).toBeDisabled();
  await page.waitForTimeout(300);
  expect(requests.some((q) => q.get("page") === "4")).toBe(false);
});

test("필터를 좁혀 한 페이지가 되면 다음 버튼이 비활성이라 없는 페이지를 prefetch하지 않는다", async ({
  page,
}) => {
  const requests = captureListRequests(page);
  await page.goto("/products");
  await expect(page.getByText(/총 30개/)).toBeVisible();

  // 카테고리 하나는 상품 6개 → 1페이지뿐이다. 좁힌 뒤엔 "다음"이 disabled가 되어,
  // 그 버튼에 hover해도 fashion의 없는 2페이지를 요청하지 않는다.
  await page.getByLabel("카테고리").selectOption("fashion");
  await expect(page.getByText(/총 6개/)).toBeVisible();
  await expect(page.getByRole("button", { name: "다음" })).toBeDisabled();

  const askedForFashionSecondPage = requests.some(
    (q) => q.get("category") === "fashion" && q.get("page") === "2",
  );
  expect(askedForFashionSecondPage).toBe(false);
});

test("무효한 URL 값은 기본값으로 정규화된다", async ({ page }) => {
  // 마지막 페이지를 넘는 page, 허용 목록 밖 pageSize를 넣어도 조회는 기본값으로 이뤄진다.
  await page.goto("/products?page=999&pageSize=999");

  await expect(page.getByText(/총 \d+개/)).toBeVisible();
  await expect(page).not.toHaveURL(/page=999/);
  await expect(page).not.toHaveURL(/pageSize=999/);
});
