import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

// jsdom 환경에서 컴포넌트/훅을 렌더해 테스트한다. @/ 별칭은 tsconfig와 맞춘다.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // e2e(Playwright)는 별도 러너라 vitest 대상에서 제외한다.
    exclude: ["e2e/**", "node_modules/**"],
  },
});
