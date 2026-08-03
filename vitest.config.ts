import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// jsdom 환경에서 컴포넌트/훅을 렌더해 테스트한다. @/ 별칭은 tsconfig와 맞춘다.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // 테스트는 클래스명을 검증하지 않으므로 프로젝트 PostCSS(Tailwind)를 태우지 않는다.
  // 이걸 비우지 않으면 CSS 모듈을 렌더하는 컴포넌트 테스트가 PostCSS 로드에서 실패한다.
  css: { postcss: { plugins: [] } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // e2e(Playwright)는 별도 러너라 vitest 대상에서 제외한다.
    exclude: ["e2e/**", "node_modules/**", ".claude/**"],
  },
});
