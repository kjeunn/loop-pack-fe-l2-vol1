import { vi } from "vitest";

// 인증 경계를 넘는 이동(세션 만료·로그인 복원)은 location.assign으로 한다.
// jsdom은 navigation을 구현하지 않으므로 호출만 감시한다. location.assign은 redefine이 막혀 있어
// 객체를 통째로 바꾸되, fetch가 상대경로를 풀 때 읽는 href/origin은 실제 값으로 채워 fetch가 깨지지 않게 한다.
export function mockLocation(pathname = "/") {
  const assign = vi.fn();
  const original = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      href: `http://localhost:3000${pathname}`,
      origin: "http://localhost:3000",
      pathname,
      search: "",
      assign,
    },
  });
  const restore = () => {
    Object.defineProperty(window, "location", { configurable: true, value: original });
  };
  return { assign, restore };
}
