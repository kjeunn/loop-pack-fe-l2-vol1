import { useCallback, useEffect, useSyncExternalStore } from "react";

// 도메인을 모르는 persist 복원 배관. 어떤 persist store든 인자로 받아 재사용한다.
type PersistApi = {
  persist: {
    onFinishHydration: (fn: () => void) => () => void;
    hasHydrated: () => boolean;
    rehydrate: () => void | Promise<void>;
  };
};

// 복원이 끝났는지 알려준다. skipHydration이라 서버·클라 첫 렌더는 항상 false다.
// 외부(persist) 상태 변화라 useState+effect 대신 useSyncExternalStore로 읽는다.
export function useHasHydrated(store: PersistApi) {
  const subscribe = useCallback(
    (onChange: () => void) => store.persist.onFinishHydration(onChange),
    [store],
  );
  const getSnapshot = useCallback(() => store.persist.hasHydrated(), [store]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

// skipHydration이라 자동 복원되지 않는다. 마운트 뒤 한 번 복원한다.
export function useRehydrate(store: PersistApi) {
  useEffect(() => {
    void store.persist.rehydrate();
  }, [store]);
}
