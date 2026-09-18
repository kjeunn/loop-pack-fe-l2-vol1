import { afterEach, describe, expect, it, vi } from "vitest";

import { getAppOrigin } from "@/shared/config/origin";

const SITE = "https://my-app-indol.vercel.app";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAppOrigin", () => {
  it("APP_ORIGIN을 그대로 돌려준다", () => {
    vi.stubEnv("APP_ORIGIN", SITE);
    expect(getAppOrigin()).toBe(SITE);
  });

  // 조용히 localhost로 폴백하면 배포에서 잘못된 self-fetch·og:url이 에러 없이 나간다.
  it.each(["", undefined])("APP_ORIGIN이 %s이면 throw한다", (value) => {
    vi.stubEnv("APP_ORIGIN", value);
    expect(() => getAppOrigin()).toThrow("APP_ORIGIN이 설정되지 않았습니다");
  });

  // Standard Protection에서 생성 URL은 인증 벽 뒤다. 그 값이 있어도 쓰지 않는다.
  it("VERCEL_URL이 있어도 무시한다", () => {
    vi.stubEnv("APP_ORIGIN", SITE);
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "my-app-git-feat-x-team.vercel.app");
    expect(getAppOrigin()).toBe(SITE);
  });
});
