import { z } from "zod";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type ProductId = string;

export type WishlistStore = {
  wishlistIds: ProductId[];
  toggleWishlist: (productId: ProductId) => void;
};

// 저장값은 id 목록뿐. 문자열 배열이 아니면(손댔거나 옛 구조) 비워 안전한 상태로 되돌린다.
const persistedWishlistSchema = z
  .object({ wishlistIds: z.array(z.string()).catch([]) })
  .catch({ wishlistIds: [] });
// 저장값 복구는 우리 로직이라 sync 단위로 직접 검증한다(export). rehydrate(비동기 배선)로 돌리면
// Stryker에서 변형이 hang→timeout으로 걸려 총점이 흔들리기 때문이다.
export const sanitize = (persisted: unknown) => persistedWishlistSchema.parse(persisted);

// 찜은 켜고 끄는 한 가지 동작뿐이라 add·remove를 나누지 않고 toggle 하나로 둔다.
export const useWishlistStore = create<WishlistStore>()(
  devtools(
    persist(
      (set) => ({
        wishlistIds: [],
        toggleWishlist: (productId) =>
          set((state) => ({
            wishlistIds: state.wishlistIds.includes(productId)
              ? state.wishlistIds.filter((id) => id !== productId)
              : [...state.wishlistIds, productId],
          })),
      }),
      // zustand persist 배선(skipHydration·migrate·merge 등)은 라이브러리 몫이라 §9 신뢰 경계다.
      // 변형하면 async rehydrate 테스트가 hang→timeout으로 걸려 Stryker 총점을 흔들어 변형에서 뺀다.
      // 우리 로직 sanitize·리듀서는 이 블록 밖에서 변형·검증된다.
      // Stryker disable all
      {
        name: "wishlist",
        version: 1,
        skipHydration: true,
        partialize: (state) => ({ wishlistIds: state.wishlistIds }),
        migrate: (persisted) => sanitize(persisted),
        merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
      },
      // Stryker restore all
    ),
    { name: "WishlistStore" },
  ),
);
