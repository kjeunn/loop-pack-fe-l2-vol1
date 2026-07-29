import { useSyncExternalStore } from "react";

import { useCommerceStore } from "@/entities/commerce/model/commerceStore";

// 저장값 복원이 끝났는지 알려준다.
// skipHydration이라 서버·클라 첫 렌더는 항상 false다. 그동안 개수 대신 로딩을 보여주면,
// 새로고침 때 잘못된 0이 잠깐 뜨지 않고 복원된 값으로 바로 이어진다.
// 외부(persist)의 상태 변화라 useState+effect 대신 useSyncExternalStore로 읽는다.
const subscribe = (onChange: () => void) => useCommerceStore.persist.onFinishHydration(onChange);
const getSnapshot = () => useCommerceStore.persist.hasHydrated();
const getServerSnapshot = () => false;

export function useHasHydrated() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
