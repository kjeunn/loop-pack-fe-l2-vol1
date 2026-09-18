import { afterEach, describe, expect, it, vi } from "vitest";

import { readServerRequestContext } from "@/shared/api/serverRequest";

// next/headers는 요청 스코프 밖에서 던진다. 각 경우를 그 자리에서 강제한다.
function mockHeaders(entries: Record<string, string> | Error) {
  vi.doMock("next/headers", () => ({
    headers: async () => {
      if (entries instanceof Error) {
        throw entries;
      }
      return new Headers(entries);
    },
  }));
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("next/headers");
});

async function readFresh() {
  const fresh = await import("@/shared/api/serverRequest");
  return fresh.readServerRequestContext();
}

describe("readServerRequestContext", () => {
  it("요청 origin을 프로토콜과 host로 조립하고 쿠키를 함께 돌려준다", async () => {
    mockHeaders({ host: "my-app-git-x.vercel.app", "x-forwarded-proto": "https", cookie: "a=1" });
    await expect(readFresh()).resolves.toEqual({
      origin: "https://my-app-git-x.vercel.app",
      cookie: "a=1",
    });
  });

  // 로컬 dev·start에는 x-forwarded-proto가 없다. https로 가정하면 로컬 self-fetch가 깨진다.
  it("x-forwarded-proto가 없으면 http로 본다", async () => {
    mockHeaders({ host: "localhost:3000" });
    await expect(readFresh()).resolves.toEqual({ origin: "http://localhost:3000", cookie: null });
  });

  it("host가 없으면 null — 호출자가 APP_ORIGIN으로 돌아간다", async () => {
    mockHeaders({ "x-forwarded-proto": "https" });
    await expect(readFresh()).resolves.toBeNull();
  });

  // 요청 스코프 밖(vitest·스크립트·정적 생성)에서는 next/headers가 던진다.
  it("headers()가 던지면 null", async () => {
    mockHeaders(new Error("outside request scope"));
    await expect(readFresh()).resolves.toBeNull();
  });

  it("실제 환경(요청 스코프 없음)에서도 던지지 않고 null", async () => {
    await expect(readServerRequestContext()).resolves.toBeNull();
  });
});
