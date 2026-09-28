import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

// 워크플로는 실행돼야만 검증되는데, 보안·실행 조건 한 줄이 빠져도 초록으로 돈다.
// 여기서 고정하는 건 "빠지면 조용히 약해지는" 불변 조건이다. 동작(스킵·측정)은 실험 PR로 본다(RFC 2.3).
//
// 일부러 빡빡하게 잡았다 — 모든 워크플로가 읽기 권한만 갖고 artifact는 trace만 올린다.
// 쓰기 권한이 필요한 워크플로(PR 코멘트 게시 등)를 나중에 더하면 이 테스트가 막는다.
// 그때는 테스트를 고쳐 어느 job이 왜 쓰기를 갖는지 여기 적는다. 조용히 넓어지는 것만 막으면 된다.
type Step = { name?: string; uses?: string; with?: Record<string, unknown>; if?: string };
type Job = {
  "timeout-minutes"?: number;
  permissions?: Record<string, string>;
  if?: string;
  env?: Record<string, string>;
  steps: Step[];
};
type Workflow = {
  on: Record<string, unknown>;
  permissions?: Record<string, string>;
  env?: Record<string, string>;
  jobs: Record<string, Job>;
};

const WORKFLOW_DIR = ".github/workflows";
// .yaml도 센다 — .yml만 보면 확장자를 바꾼 워크플로가 검사 밖으로 빠진다.
const workflows = readdirSync(WORKFLOW_DIR)
  .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
  .map((file) => ({
    file,
    workflow: parse(readFileSync(join(WORKFLOW_DIR, file), "utf8")) as Workflow,
  }));

if (workflows.length === 0) {
  throw new Error(`${WORKFLOW_DIR}에 워크플로가 없다 — describe.each가 0회 돌아 조용히 통과한다`);
}

const quality = workflows.find(({ file }) => file === "quality.yml")?.workflow;
if (!quality) {
  throw new Error("quality.yml이 없다");
}

describe.each(workflows)("$file 불변 조건", ({ workflow }) => {
  const jobs = Object.entries(workflow.jobs);
  const steps = jobs.flatMap(([, job]) => job.steps);

  it("모든 action은 40자리 커밋 SHA로 고정한다 — 태그는 뒤에서 바뀔 수 있다", () => {
    const uses = steps.map((step) => step.uses).filter((value): value is string => Boolean(value));
    expect(uses.length).toBeGreaterThan(0);
    for (const ref of uses) {
      expect(ref).toMatch(/@[0-9a-f]{40}( #|$)/);
    }
  });

  it("권한은 읽기뿐이고 pull_request_target은 쓰지 않는다 — PR 코드가 쓰기 토큰을 얻으면 안 된다", () => {
    expect(workflow.permissions).toEqual({ contents: "read" });
    for (const [, job] of jobs) {
      for (const level of Object.values(job.permissions ?? {})) {
        expect(level).toBe("read");
      }
    }
    expect(workflow.on).not.toHaveProperty("pull_request_target");
  });

  it("checkout은 자격 증명을 남기지 않고, 모든 job에 timeout이 있다", () => {
    const checkouts = steps.filter((step) => step.uses?.startsWith("actions/checkout@"));
    expect(checkouts.length).toBeGreaterThan(0);
    for (const step of checkouts) {
      expect(step.with?.["persist-credentials"]).toBe(false);
    }
    for (const [name, job] of jobs) {
      expect(job["timeout-minutes"], `${name}에 timeout-minutes 없음`).toBeGreaterThan(0);
    }
  });

  // deploy-smoke가 이걸로 깨졌었다 — 그룹이 워크플로 이름뿐이면 preview 배포의 deployment_status가
  // (job은 스킵되지만 run은 시작돼) 돌고 있던 production 스모크를 취소한다.
  it("동시성 그룹은 워크플로 이름만으로 나누지 않는다", () => {
    const concurrency = (workflow as unknown as { concurrency?: { group?: string } }).concurrency;
    if (!concurrency) {
      return;
    }
    expect(concurrency.group).toBeDefined();
    expect(concurrency.group).not.toBe("${{ github.workflow }}");
  });

  it("env에 비밀로 보이는 이름이 없다 — YAML은 공개 파일이다", () => {
    const names = [
      ...Object.keys(workflow.env ?? {}),
      ...jobs.flatMap(([, job]) => Object.keys(job.env ?? {})),
    ];
    for (const name of names) {
      expect(name).not.toMatch(/SECRET|TOKEN|PASSWORD|PRIVATE|KEY/);
    }
  });

  it("artifact는 trace.zip만 올리고 보존 기간이 있다 — storageState·리포트 전체를 올리지 않는다", () => {
    const uploads = steps.filter((step) => step.uses?.startsWith("actions/upload-artifact@"));
    for (const step of uploads) {
      expect(String(step.with?.path)).toMatch(/trace\.zip$/);
      expect(step.with?.["retention-days"]).toBeGreaterThan(0);
    }
  });
});

describe("quality.yml 실행 조건", () => {
  it("e2e는 판정(changes)이 실패하면 스킵이 아니라 실행이다 — 모르면 실행이 기본", () => {
    const condition = quality.jobs.e2e?.if ?? "";
    expect(condition).toContain("!cancelled()");
    expect(condition).toContain("needs.changes.result != 'success'");
    expect(condition).toContain("needs.changes.outputs.runtime == 'true'");
  });

  // 스킵 판정의 핵심은 필터 내용이다. 여기가 조용히 바뀌면(예: "!**") 모든 PR에서 E2E가 빠진다.
  // PR #9은 필터를 깨뜨려 job이 실패하는 쪽을 봤고, 이 테스트는 의미가 바뀌는 쪽을 본다.
  it("E2E 스킵 필터는 deny-list이고 부정 패턴을 실제로 적용한다", () => {
    const step = quality.jobs.changes?.steps.find((candidate) =>
      candidate.uses?.startsWith("dorny/paths-filter@"),
    );
    expect(step, "paths-filter step을 찾지 못했다").toBeDefined();
    // 기본값(some)은 부정 패턴을 무시해 문서 변경도 runtime=true가 된다.
    expect(step?.with?.["predicate-quantifier"]).toBe("some-with-excludes");

    const filters = parse(String(step?.with?.filters)) as { runtime?: string[] };
    expect(filters.runtime?.[0], "첫 패턴이 전체(**)여야 deny-list다").toBe("**");
    expect(filters.runtime?.slice(1)).toEqual(["!docs/**", "!**/*.md", "!.claude/**"]);
  });

  it("quality는 Validate env → Build → Bundle budget 순서다", () => {
    const names = quality.jobs.quality?.steps.map((step) => step.name) ?? [];
    const at = (name: string) => names.indexOf(name);
    expect(at("Validate env")).toBeGreaterThanOrEqual(0);
    expect(at("Validate env")).toBeLessThan(at("Build"));
    expect(at("Build")).toBeLessThan(at("Bundle budget"));
  });
});

// 배포본 스모크는 @writes 태그가 붙은 스펙을 뺀다. 태그가 지워지거나, 서버 상태를 바꾸는 스펙이
// 태그 없이 새로 생기면 production에 테스트 데이터가 쌓인다.
// 휴리스틱의 전제는 "서버 상태를 바꾸는 라우트가 /api/orders 하나"라는 것이고, 그 전제도 아래에서 고정한다.
describe("배포본 스모크 범위", () => {
  const E2E_DIR = "e2e";
  const specs = readdirSync(E2E_DIR)
    .filter((file) => file.endsWith(".spec.ts"))
    .map((file) => ({ file, source: readFileSync(join(E2E_DIR, file), "utf8") }));

  it("서버 상태를 바꾸는 라우트는 /api/orders 하나다 — 아래 태그 검사의 전제", () => {
    // 변이 함수 목록이 이 둘뿐이라는 것부터 고정한다. 셋째가 생기면 여기서 걸려 태그 기준을 다시 보게 된다.
    const store = readFileSync("src/app/api/_data/auth.ts", "utf8");
    expect(store.match(/ordersByUser\.(set|clear|delete)\(/g)).toHaveLength(2);
    const MUTATORS = ["addOrder", "resetOrders"];

    const apiDir = "src/app/api";
    const mutating = readdirSync(apiDir, { recursive: true, encoding: "utf8" })
      .filter((entry) => entry.endsWith("route.ts"))
      .filter((entry) => {
        const source = readFileSync(join(apiDir, entry), "utf8");
        return MUTATORS.some((name) => source.includes(name));
      });
    expect(mutating).toEqual(["orders/route.ts"]);
  });

  it("주문 API를 부르는 스펙에는 @writes가 붙어 있다", () => {
    expect(specs.length).toBeGreaterThan(0);
    const writers = specs.filter(({ source }) => source.includes("/api/orders"));
    expect(writers.map(({ file }) => file)).toEqual(["order.spec.ts"]);
    // 파일 어디든 "@writes"가 있으면 통과하게 두면, 이유를 적은 주석이 제목을 대신해 테스트가 헛돈다
    // (실제로 그렇게 짰다가 태그를 지우는 뮤테이션에 안 걸렸다). --grep은 제목만 보므로 제목에서 찾는다.
    const taggedTitle = /\btest(\.describe)?\(\s*"[^"]*@writes[^"]*"/;
    for (const { file, source } of writers) {
      expect(taggedTitle.test(source), `${file}의 test·describe 제목에 @writes가 없다`).toBe(true);
    }
  });
});
