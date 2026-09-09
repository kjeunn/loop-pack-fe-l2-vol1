import { type NextRequest, NextResponse } from "next/server";

import { readSessionToken } from "@/app/api/_data/auth";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";

// 보호 경로 인그레스 게이트. 세션 쿠키를 서명·TTL까지 검증해, 없거나 무효면 로그인으로 보낸다.
// proxy는 Node 런타임이라(Next 16 기본) node:crypto를 쓰는 auth.ts를 그대로 쓴다.
//
// "진입 때 죽은 세션"은 여기 한 곳이 맡는다 — 쿠키가 없는 미로그인도, 있지만 만료·위조된 것도.
// 존재만 보면 무효 쿠키가 통과해 SSR이 로그아웃 상태로 그리고, 보호 쿼리는 enabled=false라
// 401도 안 나서 사용자가 보호 페이지에 그대로 남는다(실제 만료 쿠키 E2E가 이 경로를 고정한다).
// 진행 중 만료(이미 그려진 화면에서 API 401)는 queryClient 전역 핸들러가 맡는다 — 순간마다 한 곳.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (readSessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  // 원래 가려던 경로를 복원용으로 싣는다. 이 값은 로그인 페이지가 safeRedirect로 다시 검증해 소비한다.
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  // 쿠키가 있었는데 무효면 "로그인한 적 없음"이 아니라 "만료·위조"다. 로그인 화면이 구분해 안내한다.
  if (token) {
    loginUrl.searchParams.set("reason", "expired");
  }
  return NextResponse.redirect(loginUrl);
}

// 보호 경로만 매칭한다 — 주문서·주문내역. 공개 경로(홈·상품·장바구니·로그인)는 여기 없다.
export const config = {
  matcher: ["/order-form", "/orders"],
};
