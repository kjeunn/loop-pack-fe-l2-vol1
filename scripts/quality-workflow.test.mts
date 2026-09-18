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

  it("quality는 Validate env → Build → Bundle budget 순서다", () => {
    const names = quality.jobs.quality?.steps.map((step) => step.name) ?? [];
    const at = (name: string) => names.indexOf(name);
    expect(at("Validate env")).toBeGreaterThanOrEqual(0);
    expect(at("Validate env")).toBeLessThan(at("Build"));
    expect(at("Build")).toBeLessThan(at("Bundle budget"));
  });
});
