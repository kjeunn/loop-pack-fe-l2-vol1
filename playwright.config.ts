import { defineConfig, devices } from "@playwright/test";

// 진짜 브라우저에서 도는 E2E. jsdom이 못 하는 레이아웃(floating 위치)·실제 스크롤/키보드 경로를 본다.
// 유닛(vitest)은 e2e/를 제외하므로 러너가 서로 겹치지 않는다.
export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
