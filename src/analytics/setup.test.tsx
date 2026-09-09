// @vitest-environment jsdom
import { useEffect } from "react";

import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// 실제 배선(setup.ts)이 첫 렌더의 이벤트에 공통 프로퍼티를 붙이는지 본다.
// React는 자식 effect를 부모보다 먼저 돌리므로, 등록이 부모 effect 안에 있으면 자식의 마운트 이벤트가
// 공통 프로퍼티 없이 큐에 들어간다(track은 enqueue 시점에 병합한다). 모듈 상태를 매번 새로 읽어
// 실제 앱의 첫 로드(예: proxy 307 뒤 /login 하드 로드)를 재현한다.
async function loadFresh() {
  vi.resetModules();
  const [{ setupAnalytics }, { trackEvent }] = await Promise.all([
    import("@/analytics/setup"),
    import("@/analytics/schema"),
  ]);
  return { setupAnalytics, trackEvent };
}

describe("계측 배선 — 첫 렌더", () => {
  afterEach(() => {
    window.__analytics = undefined;
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("부모 effect에서 켜기 전에 자식 마운트 effect가 찍은 이벤트에도 공통 프로퍼티가 붙는다", async () => {
    const { setupAnalytics, trackEvent } = await loadFresh();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    );

    function Child() {
      useEffect(() => {
        trackEvent("login_start", { from: "/orders" });
      }, []);
      return null;
    }
    // providers.tsx와 같은 배치 — 부모의 effect에서 켠다.
    function Parent() {
      useEffect(() => {
        setupAnalytics();
      }, []);
      return <Child />;
    }
    render(<Parent />);

    await waitFor(() => expect(window.__analytics).toHaveLength(1));
    const [recorded] = window.__analytics ?? [];
    expect(recorded.event).toBe("login_start");
    // 퍼널 join 키 sessionId를 비롯한 공통 프로퍼티가 첫 이벤트부터 있어야 한다.
    expect(recorded.properties.sessionId).toEqual(expect.any(String));
    expect(recorded.properties.device).toBeDefined();
    expect(recorded.properties.ts).toBeDefined();
  });
});
