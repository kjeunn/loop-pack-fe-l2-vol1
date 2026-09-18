import { afterEach, describe, expect, it, vi } from "vitest";

import { getServerFetchOrigin, getSiteOrigin } from "@/shared/config/origin";

const SITE = "https://my-app-indol.vercel.app";
const PREVIEW_HOST = "my-app-git-feat-x-team.vercel.app";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSiteOrigin", () => {
  it("APP_ORIGIN을 그대로 돌려준다", () => {
    vi.stubEnv("APP_ORIGIN", SITE);
    expect(getSiteOrigin()).toBe(SITE);
  });

  // 조용히 localhost로 폴백하면 배포에서 잘못된 og:url이 에러 없이 나간다.
  it.each(["", undefined])("APP_ORIGIN이 %s이면 throw한다", (value) => {
    vi.stubEnv("APP_ORIGIN", value);
    expect(() => getSiteOrigin()).toThrow("APP_ORIGIN이 설정되지 않았습니다");
  });
});

describe("getServerFetchOrigin", () => {
  it("preview 배포에서는 배포 자신(VERCEL_URL)을 https로 부른다", () => {
    vi.stubEnv("APP_ORIGIN", SITE);
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", PREVIEW_HOST);
    expect(getServerFetchOrigin()).toBe(`https://${PREVIEW_HOST}`);
    expect(getSiteOrigin()).toBe(SITE);
  });

  // production의 VERCEL_URL은 생성 URL이라 Deployment Protection 대상이다. 공개 주소인 APP_ORIGIN을 써야 한다.
  it("production 배포에서는 VERCEL_URL이 있어도 APP_ORIGIN을 쓴다", () => {
    vi.stubEnv("APP_ORIGIN", SITE);
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "my-app-abc123-team.vercel.app");
    expect(getServerFetchOrigin()).toBe(SITE);
  });

  it("Vercel 밖(로컬·CI)이나 VERCEL_URL이 빈 preview에서는 APP_ORIGIN을 쓴다", () => {
    vi.stubEnv("APP_ORIGIN", SITE);
    vi.stubEnv("VERCEL_ENV", undefined);
    vi.stubEnv("VERCEL_URL", "my-app-abc123-team.vercel.app");
    expect(getServerFetchOrigin()).toBe(SITE);

    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "");
    expect(getServerFetchOrigin()).toBe(SITE);
  });

  it("preview라도 APP_ORIGIN이 없으면 throw한다 — 사이트 origin은 preview에서도 필요하다", () => {
    vi.stubEnv("APP_ORIGIN", undefined);
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", PREVIEW_HOST);
    expect(getServerFetchOrigin()).toBe(`https://${PREVIEW_HOST}`);
    expect(() => getSiteOrigin()).toThrow();
  });
});
