// [분리 근거] 위시리스트 = localStorage와 동기화되는 클라이언트 상태 + 토글 동작 한 묶음.
// 필터·서버상태 등 페이지의 다른 관심사와 함께 바뀌지 않으므로 독립 hook으로 분리한다.
import { useEffect, useState } from "react";

const STORAGE_KEY = "wishlist";

function readStoredWishlist(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState<number[]>(readStoredWishlist);

  // localStorage(외부 시스템)에 상태 변화를 반영하는 동기화 → effect의 정당한 용도.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, [wishlist]);

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  return { wishlist, toggleWishlist };
}
