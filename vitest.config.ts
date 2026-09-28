import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// @/ 별칭은 tsconfig와 맞춘다. 환경은 기본 node이고, DOM이 필요한 테스트만 jsdom으로 선언한다(아래).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // server-only는 react-server 조건에서만 빈 모듈로 풀리고, 그 밖에서는 import 즉시 throw한다.
      // vitest는 node로 도니 빈 모듈(패키지가 서버용으로 제공하는 파일)을 직접 가리킨다.
      // 클라이언트에서 실수로 import하는 것을 잡는 진짜 관문은 next build다.
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  // 테스트는 클래스명을 검증하지 않으므로 프로젝트 PostCSS(Tailwind)를 태우지 않는다.
  // 이걸 비우지 않으면 CSS 모듈을 렌더하는 컴포넌트 테스트가 PostCSS 로드에서 실패한다.
  css: { postcss: { plugins: [] } },
  test: {
    // 기본은 node. DOM이 필요한 테스트만 파일 상단에 `// @vitest-environment jsdom`으로 선언한다.
    // 전부 jsdom으로 돌리면 DOM이 필요 없는 테스트까지 매번 브라우저 흉내 환경을 세워,
    // 테스트가 늘수록 비용이 쌓이기 때문이다.
    // (측정: `vitest run`의 environment 항목, 3회 median.
    //  분리 ~27s(24–31s) vs 전부 jsdom ~76s(69–82s).)
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // origin.ts는 APP_ORIGIN 미설정 시 throw하므로 테스트 환경에 origin을 준다(비배포 컨텍스트).
    env: { APP_ORIGIN: "http://localhost:3000" },
    // e2e(Playwright)는 별도 러너라 제외한다.
    // .stryker-tmp는 프로젝트 사본이 든 뮤테이션 샌드박스라, 제외하지 않으면
    // 그 안의 (node_modules 포함) 테스트까지 주워 돈다.
    exclude: ["e2e/**", "**/node_modules/**", ".claude/**", ".stryker-tmp/**"],
  },
});
