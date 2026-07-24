import { expect, test } from "@playwright/test";

// URL 조건 복원과 store 유지는 브라우저 히스토리·라우터가 얽혀 jsdom에서 못 본다 → 진짜 브라우저로 확인한다.

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

test("검색어를 바꾸면 결과가 필터되고, 없으면 빈 상태를 보여준다", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByText(/총 \d+개/)).toBeVisible();

  // 어떤 상품과도 안 맞는 검색어 → 빈 상태 문구.
  await page.getByPlaceholder("상품명 또는 브랜드").fill("존재하지않는상품zzz");
  await expect(page).toHaveURL(/q=/);
  await expect(page.getByText("조건에 맞는 상품이 없습니다.")).toBeVisible();
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

test("무효한 URL 값은 기본값으로 정규화된다", async ({ page }) => {
  // 마지막 페이지를 넘는 page, 허용 목록 밖 pageSize를 넣어도 조회는 기본값으로 이뤄진다.
  await page.goto("/products?page=999&pageSize=999");

  await expect(page.getByText(/총 \d+개/)).toBeVisible();
  await expect(page).not.toHaveURL(/page=999/);
  await expect(page).not.toHaveURL(/pageSize=999/);
});
