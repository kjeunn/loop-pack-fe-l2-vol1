// [분리 근거] 최근 본 상품 = localStorage와 동기화되는 클라이언트 상태 + 추가 동작 한 묶음.
// 위시리스트와 저장 패턴은 같지만 동작(최신 우선·상한 유지)이 달라 별도 hook으로 둔다.
import { useEffect, useState } from "react";

const STORAGE_KEY = "recentlyViewed";
const MAX_ITEMS = 10;

function readStoredRecentlyViewed(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>(readStoredRecentlyViewed);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, [recentlyViewed]);

  // 이미 있으면 제거 후 맨 앞에 다시 넣어 "최신순"을 유지하고, 상한 개수로 자른다.
  const addRecentlyViewed = (productId: number) => {
    setRecentlyViewed((prev) => {
      const without = prev.filter((id) => id !== productId);
      return [productId, ...without].slice(0, MAX_ITEMS);
    });
  };

  return { recentlyViewed, addRecentlyViewed };
}
