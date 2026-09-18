import { ESLint, type Linter } from "eslint";
import { describe, expect, it } from "vitest";

// 승격한 규칙은 설정에서 지워져도 아무것도 울리지 않는다. 규칙이 살아 있고 예외 범위가 그대로인지를 고정한다.
//
// 두 층으로 나눈 이유: 규칙 블록만 떼어 검사하면 "블록의 내용"은 보지만 "그 블록이 src에 실제로 적용되는가"는
// 못 본다. globalIgnores가 src를 덮거나 files 패턴이 바뀌면 진짜 lint는 건너뛰는데 테스트는 통과한다.
// 그래서 적용 여부는 실제 해석된 설정으로(A), 동작은 룰만 올린 가벼운 인스턴스로(B) 본다.
// 실제 설정으로 lintText까지 하면 타입 정보를 로딩해 15초가 넘는데, 이 룰은 구문만 본다.
const eslint = new ESLint({ cwd: process.cwd() });

const configPath = "../eslint.config.mjs";
const { default: eslintConfig } = (await import(configPath)) as { default: Linter.Config[] };

// find로 첫 블록만 집으면, 나중에 같은 룰을 켠 블록이 하나 더 생겨도 옛 블록만 보고 통과한다.
const ruleBlocks = eslintConfig.filter(
  (block) => block.files && block.rules?.["no-restricted-imports"],
);
if (ruleBlocks.length !== 1) {
  throw new Error(
    `no-restricted-imports 블록이 ${ruleBlocks.length}개다. 이 테스트는 한 블록을 전제한다`,
  );
}
const [ruleBlock] = ruleBlocks;

type ParserLike = { meta?: { name?: string } };
const parser = eslintConfig
  .map((block) => block.languageOptions?.parser)
  .find((candidate) =>
    (candidate as ParserLike | undefined)?.meta?.name?.includes("typescript-eslint"),
  );
if (!ruleBlock || !parser) {
  throw new Error("eslint.config.mjs에서 no-restricted-imports 블록 또는 TS 파서를 찾지 못했다");
}

const ruleOnly = new ESLint({
  cwd: process.cwd(),
  overrideConfigFile: true,
  overrideConfig: [{ files: ["**/*.{ts,tsx,mts}"], languageOptions: { parser } }, ruleBlock],
});

async function relativeImportMessages(filePath: string, code: string) {
  const [result] = await ruleOnly.lintText(code, { filePath });
  return (result?.messages ?? []).filter((message) => message.ruleId === "no-restricted-imports");
}

describe("A. 규칙이 src에 실제로 적용된다", () => {
  it("src 파일은 무시 대상이 아니고 규칙이 error로 해석된다", async () => {
    const filePath = "src/app/layout.tsx";
    expect(await eslint.isPathIgnored(filePath)).toBe(false);
    const config = await eslint.calculateConfigForFile(filePath);
    const [severity] = config.rules?.["no-restricted-imports"] ?? [];
    expect(severity).toBe(2);
  });

  it("src 밖(scripts)에는 규칙이 붙지 않는다 — @/ alias가 없어 상대경로가 정상이다", async () => {
    const config = await eslint.calculateConfigForFile("scripts/validate-env.mts");
    expect(config.rules?.["no-restricted-imports"]).toBeUndefined();
  });
});

describe("B. 규칙이 잡는 것과 봐주는 것", () => {
  it("src 안의 ./·../ import를 잡는다", async () => {
    const messages = await relativeImportMessages(
      "src/features/x/ui/A.tsx",
      'import { a } from "./a";\nimport { b } from "../model/b";\n',
    );
    expect(messages).toHaveLength(2);
    expect(messages[0]?.message).toContain("@/");
  });

  it("같은 폴더의 CSS(*.module.css·globals.css)와 @/ 절대경로는 통과한다", async () => {
    const messages = await relativeImportMessages(
      "src/app/layout.tsx",
      'import "./globals.css";\nimport styles from "./page.module.css";\nimport { x } from "@/shared/lib/x";\n',
    );
    expect(messages).toEqual([]);
  });

  // 한 폴더 위의 CSS는 예외가 아니다. 예외는 "콜로케이트된 CSS"까지다.
  it("../ 로 올라가는 CSS는 예외가 아니다", async () => {
    const messages = await relativeImportMessages(
      "src/features/x/ui/A.tsx",
      'import "../shared.css";\n',
    );
    expect(messages).toHaveLength(1);
  });
});
