import { useSyncExternalStore } from "react";

// 서버·하이드레이션 중에는 false, 클라이언트 마운트 후 true.
// Portal을 서버에선 안 그리고 마운트 후에만 그린다.
// 그래서 open=true로 시작해도 hydration 불일치나 document 접근 오류가 없다.
// useEffect+setState(effect 내 setState 금지 룰에 걸림) 대신 useSyncExternalStore로 "클라이언트인가"를 읽는다.

// 동작 원리: getSnapshot(true)과 getServerSnapshot(false)의 서버·클라 값 차이가 핵심이다.
// React가 서버·하이드레이션에선 getServerSnapshot(false)을, 마운트 후엔 getSnapshot(true)을 읽는다.
// 둘이 달라 한 번 리렌더하면서 false에서 true로 넘어간다.
// subscribe는 no-op다 — 값이 한 번 true가 되면 안 바뀌어 구독할 변화가 없다.
// 세 함수는 모듈 상수로 둔다. 컴포넌트 안에 두면 매 렌더 새 함수라 useSyncExternalStore가 재구독한다.
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
