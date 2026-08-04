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
const sanitize = (persisted: unknown) => persistedWishlistSchema.parse(persisted);

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
      {
        name: "wishlist",
        version: 1,
        skipHydration: true,
        partialize: (state) => ({ wishlistIds: state.wishlistIds }),
        migrate: (persisted) => sanitize(persisted),
        merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
      },
    ),
    { name: "WishlistStore" },
  ),
);
