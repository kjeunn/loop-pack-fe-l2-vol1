import { consoleProvider } from "@/analytics/consoleProvider";
import { initAnalytics, registerProviders, setCommonProperties } from "@/analytics/logger";
import { getCommonProperties } from "@/analytics/session";

// 등록(provider·공통 프로퍼티)은 모듈 평가 시점에 동기로 끝낸다. effect에 두면 React가 자식 effect를
// 부모보다 먼저 돌려, 자식의 마운트 이벤트(login_start 등)가 공통 프로퍼티 없이 큐에 들어간다
// (track은 enqueue 시점에 병합해 나중에 보충되지 않는다). providers.tsx(앱 루트)가 이 모듈을 import하므로
// 어떤 컴포넌트 effect보다 먼저 평가된다. 순수 대입이라 서버 모듈 평가에서도 안전하다.
registerProviders([consoleProvider]);
setCommonProperties(getCommonProperties);

// 초기화만 effect에서 한다 — 비동기이고(provider initialize) 브라우저에서 1회면 된다.
// 그 전에 쌓인 이벤트는 로거 큐가 순서대로 흘려보낸다. 실제 분석 도구는 붙이지 않는다(명세).
export function setupAnalytics(): void {
  void initAnalytics();
}
