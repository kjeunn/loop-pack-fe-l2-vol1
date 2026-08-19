import { defineConfig, devices } from "@playwright/test";

// 진짜 브라우저에서 도는 E2E. jsdom이 못 하는 레이아웃(floating 위치)·실제 스크롤/키보드 경로를 본다.
// 유닛(vitest)은 e2e/를 제외하므로 러너가 서로 겹치지 않는다.
// E2E는 `pnpm test`(vitest)에 넣지 않고 별도 `pnpm test:e2e`로 둔다. 프로덕션 빌드+실브라우저라
// 느리고 잘 깨져, 매 커밋 도는 유닛·통합의 빠른 피드백과 분리하는 편이 낫다.
export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // 프로덕션 빌드 위에서 돌린다. 개발 서버로만 통과하는 E2E는 인정하지 않으므로(번들·라우팅·실 CSS가
  // 개발 서버와 달라질 수 있다) build 후 start로 실제 배포와 같은 서버를 띄운다.
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    // CI에선 매번 새로 빌드·기동한다. 로컬에선 이미 띄운 서버를 재사용하되,
    // 개발 서버(pnpm dev)를 재사용하지 않도록 프로덕션 서버를 먼저 띄워 둔다.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
