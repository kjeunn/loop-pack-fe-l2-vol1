import { expect, test } from "@playwright/test";

// 홈은 서버에서 프리패치해 첫 HTML에 데이터가 담긴다(Advanced B). 실제 렌더를 브라우저로 확인한다.

test("홈에 배너·카테고리·인기 상품·신상품이 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "매일 새롭게 발견하는 취향" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "카테고리" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "인기 상품" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "신상품" })).toBeVisible();
});

test("홈에서 담은 상품이 목록으로 이동해도 담긴 상태로 보인다", async ({ page }) => {
  await page.goto("/");

  const firstCart = page.getByRole("button", { name: /장바구니$/ }).first();
  await firstCart.click();
  await expect(page.getByText(/장바구니 1/)).toBeVisible();

  await page.getByRole("link", { name: "상품", exact: true }).click();
  await expect(page).toHaveURL(/\/products/);
  // 헤더 개수는 화면을 옮겨도 유지된다.
  await expect(page.getByText(/장바구니 1/)).toBeVisible();
});

test("찜하면 하트가 채워진 상태로 바뀐다", async ({ page }) => {
  await page.goto("/");

  const firstWish = page.getByRole("button", { name: /위시리스트$/ }).first();
  await expect(firstWish).toHaveAttribute("aria-pressed", "false");

  await firstWish.click();
  await expect(firstWish).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/위시리스트 1/)).toBeVisible();
});
