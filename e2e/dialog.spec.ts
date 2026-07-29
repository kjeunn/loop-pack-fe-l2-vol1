import { expect, test } from "@playwright/test";

// 중첩 Dialog의 스크롤 잠금·Esc 스택을 진짜 브라우저에서 확인한다(유닛에도 있지만 실제 경로 재확인).
test("중첩 Dialog: Esc는 위부터 닫고, 배경 스크롤은 마지막까지 잠긴다", async ({ page }) => {
  await page.goto("/demo");

  await page.getByRole("button", { name: "바깥 Dialog 열기" }).click();
  await page.getByRole("button", { name: "안쪽 Dialog 열기" }).click();

  const inner = page.getByRole("heading", { name: "안쪽 Dialog", exact: true });
  const outer = page.getByRole("heading", { name: "바깥 Dialog", exact: true });
  await expect(inner).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  // Esc 1회 → 안쪽만 닫힘, 바깥은 남고 스크롤은 여전히 잠김.
  await page.keyboard.press("Escape");
  await expect(inner).toBeHidden();
  await expect(outer).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  // Esc 2회 → 바깥도 닫히고 스크롤 복원.
  await page.keyboard.press("Escape");
  await expect(outer).toBeHidden();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});
