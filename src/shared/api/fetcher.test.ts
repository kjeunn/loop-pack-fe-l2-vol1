import { afterEach, describe, expect, it, vi } from "vitest";

// 서버 분기의 URL 조립과 쿠키 전달을 고정한다. 둘 다 배포 환경에서만 드러나는 동작이라
// 여기서 스텁으로 강제하지 않으면 초록불 아래 비어 있게 된다(쿠키 전달을 꺼도 다른 테스트는 전부 통과했다).
function mockRequestContext(context: { origin: string; cookie: string | null } | null) {
  vi.doMock("@/shared/api/serverRequest", () => ({
    readServerRequestContext: async () => context,
  }));
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/shared/api/serverRequest");
  vi.unstubAllGlobals();
});

async function callFetchJson(path: string) {
  const fetchSpy = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchSpy);
  const { fetchJson } = await import("@/shared/api/fetcher");
  await fetchJson(path);
  return fetchSpy.mock.calls[0] as [string, RequestInit];
}

describe("fetchJson (서버 분기)", () => {
  it("들어온 요청의 origin으로 절대 URL을 만든다 — APP_ORIGIN이 아니다", async () => {
    mockRequestContext({ origin: "https://my-app-git-x.vercel.app", cookie: null });
    const [url] = await callFetchJson("/api/home");
    expect(url).toBe("https://my-app-git-x.vercel.app/api/home");
  });

  // 인증 벽(Deployment Protection)이 걸린 배포에서는 이 쿠키가 있어야 self-fetch가 통과한다.
  it("요청 쿠키를 그대로 넘긴다", async () => {
    mockRequestContext({ origin: "https://x.vercel.app", cookie: "_vercel_jwt=abc; other=1" });
    const [, init] = await callFetchJson("/api/home");
    expect((init.headers as Record<string, string>).cookie).toBe("_vercel_jwt=abc; other=1");
  });

  it("쿠키가 없으면 cookie 헤더를 붙이지 않는다", async () => {
    mockRequestContext({ origin: "https://x.vercel.app", cookie: null });
    const [, init] = await callFetchJson("/api/home");
    expect(init.headers).toBeUndefined();
  });

  // 요청 스코프 밖(스크립트·정적 경로)에서는 선언한 origin으로 돌아간다.
  it("요청 맥락이 없으면 APP_ORIGIN을 쓴다", async () => {
    mockRequestContext(null);
    const [url] = await callFetchJson("/api/home");
    expect(url).toBe("http://localhost:3000/api/home");
  });
});
