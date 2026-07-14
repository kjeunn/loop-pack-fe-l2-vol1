import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // week-03까지 쓰던 엄격 룰을 Next 기반 위에 이식한다.
  // react/react-hooks/@typescript-eslint 플러그인은 eslint-config-next가 이미 등록했으므로
  // 여기선 룰만 강화하고, 새 플러그인(simple-import-sort)만 추가로 등록한다.
  {
    plugins: { "simple-import-sort": simpleImportSort },
    // eslint-disable 인라인 우회 금지 (하네스 규칙)
    linterOptions: { noInlineConfig: true },
    rules: {
      // ── Import 순서 ──
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^react"], // 1. React
            ["^@?\\w"], // 2. 외부 라이브러리
            ["^@/"], // 3. 프로젝트 내부 (절대경로 alias @/*)
            ["^\\."], // 4. 프로젝트 내부 파일 (상대 경로)
            ["^\\u0000"], // 5. CSS / side-effect (마지막)
          ],
        },
      ],
      "simple-import-sort/exports": "error",

      // ── TypeScript ──
      "@typescript-eslint/no-explicit-any": "error", // any = 타입 안전성 포기
      "@typescript-eslint/ban-ts-comment": "error", // ts-ignore/nocheck로 검사 우회 금지
      "@typescript-eslint/no-unused-vars": "error", // 미사용 변수 커밋 전 제거

      // ── JS 기본 ──
      eqeqeq: ["error", "always"], // == 대신 === 강제
      "prefer-const": "error", // 재할당 없으면 const
      "no-var": "error", // var 금지
      "no-empty": "error", // 빈 블록 금지 (에러 명시적 처리)
      "no-console": ["error", { allow: ["warn", "error"] }], // console.log 커밋 금지

      // ── React ──
      "react/jsx-key": "error", // 리스트 key 누락 방지

      // ── Hooks: 위반 시 런타임 버그 직결 ──
      "react-hooks/exhaustive-deps": "error", // 의존성 누락 = stale closure
      "react-hooks/set-state-in-effect": "error", // effect 안 setState 오남용 방지
      "react-hooks/set-state-in-render": "error", // 렌더 본문 setState = 무한 리렌더 방지
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  // prettier와 충돌하는 포맷 룰을 끈다. 반드시 마지막에 둔다.
  eslintConfigPrettier,
]);

export default eslintConfig;
