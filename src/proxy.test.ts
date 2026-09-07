import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { accounts, createSessionToken } from "@/app/api/_data/auth";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/app/api/_data/auth-cookies";
import { proxy } from "@/proxy";

// 함수를 직접 부르므로 matcher(어느 경로에 걸리나)는 여기서 검증되지 않는다 — 그건 실제 라우팅을 타는
// E2E만 본다. 여기는 걸린 요청에 대한 판정 세 갈래(유효·없음·무효)만 고정한다.
const request = (cookie?: string) => {
  const req = new NextRequest("http://localhost:3000/orders?page=2");
  if (cookie !== undefined) {
    req.cookies.set(SESSION_COOKIE, cookie);
  }
  return req;
};

describe("proxy 판정", () => {
  it("유효한 세션이면 통과한다", () => {
    const response = proxy(request(createSessionToken(accounts[0].id)));
    expect(response.headers.get("location")).toBeNull();
  });

  it("쿠키가 없으면 원래 경로(쿼리 포함)를 싣고 로그인으로 보낸다 — reason 없음", () => {
    const location = proxy(request()).headers.get("location");
    expect(location).toBe("http://localhost:3000/login?redirect=%2Forders%3Fpage%3D2");
  });

  it("쿠키가 있는데 만료됐으면 reason=expired를 붙여 로그인으로 보낸다", () => {
    const expired = createSessionToken(
      accounts[0].id,
      Date.now() - (SESSION_TTL_SECONDS + 60) * 1_000,
    );
    const location = proxy(request(expired)).headers.get("location");
    expect(location).toBe(
      "http://localhost:3000/login?redirect=%2Forders%3Fpage%3D2&reason=expired",
    );
  });

  it("쿠키가 있는데 서명이 틀리면(위조) 만료와 같이 취급한다", () => {
    const location = proxy(request("forged.token")).headers.get("location");
    expect(location).toContain("reason=expired");
  });
});
