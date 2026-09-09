import type { PersistStorage, StorageValue } from "zustand/middleware";

// zustand 기본 storage(createJSONStorage)는 실패 경로 둘을 처리하지 못한다 —
// localStorage 접근이 throw하면(사이트별 저장소 차단) persist API 자체를 만들지 않아
// hasHydrated()가 TypeError로 죽고, 저장값이 JSON이 아니면 복원이 끝나지 않아 화면이
// 영원히 "불러오는 중"에 머문다. 저장은 있으면 좋은 것이라, 읽기·쓰기가 실패하면
// 빈 값·무시로 넘어가 앱이 메모리만으로 동작하게 한다.
export function createSafeStorage<T>(): PersistStorage<T> {
  return {
    getItem: (name) => {
      try {
        const raw = localStorage.getItem(name);
        if (raw === null) {
          return null;
        }
        const parsed: unknown = JSON.parse(raw);
        // `null`·숫자 같은 비객체 JSON은 persist가 .version을 읽다 다시 throw하므로 없는 값으로 본다.
        return typeof parsed === "object" && parsed !== null ? (parsed as StorageValue<T>) : null;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        localStorage.setItem(name, JSON.stringify(value));
      } catch {
        // 쿼터 초과·접근 차단. 이번 저장만 건너뛴다.
      }
    },
    removeItem: (name) => {
      try {
        localStorage.removeItem(name);
      } catch {
        // 접근 차단. 지울 것도 없다.
      }
    },
  };
}
