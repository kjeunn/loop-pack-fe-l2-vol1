import { expect, test } from "@playwright/test";

// 플로팅 위치는 레이아웃 계산이 필요해 jsdom에선 검증 불가 → 진짜 브라우저(E2E)로 확인한다.
test("floating select: 메뉴가 트리거 바로 아래에 뜨고 너비가 트리거에 맞는다", async ({ page }) => {
  await page.goto("/demo");

  // 헤딩 바로 다음 그룹(div) 안의 트리거만 콕 집는다.
  const trigger = page
    .getByRole("heading", { name: /플로팅 팝오버/ })
    .locator("xpath=following-sibling::div")
    .getByRole("button");
  await expect(trigger).toBeVisible();
  await trigger.click();

  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();

  const triggerBox = await trigger.boundingBox();
  const listboxBox = await listbox.boundingBox();
  if (!triggerBox || !listboxBox) throw new Error("boundingBox 측정 실패");

  // 메뉴가 트리거 아래에 위치(offset 포함).
  expect(listboxBox.y).toBeGreaterThanOrEqual(triggerBox.y + triggerBox.height - 1);
  // size 미들웨어로 너비가 트리거에 맞춰진다.
  expect(Math.abs(listboxBox.width - triggerBox.width)).toBeLessThan(2);
});
