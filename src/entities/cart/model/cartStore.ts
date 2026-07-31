import { z } from "zod";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type ProductId = string;

export type CartStore = {
  cartIds: ProductId[];
  addToCart: (productId: ProductId) => void;
  removeFromCart: (productId: ProductId) => void;
};

// 저장값은 id 목록뿐. 문자열 배열이 아니면(손댔거나 옛 구조) 비워 안전한 상태로 되돌린다.
const persistedCartSchema = z
  .object({ cartIds: z.array(z.string()).catch([]) })
  .catch({ cartIds: [] });
const sanitize = (persisted: unknown) => persistedCartSchema.parse(persisted);

// 담은 상품은 id만 갖는다. 이름·가격은 서버 응답이 소유하므로 복사하면 두 곳이 어긋난다.
// 개수도 저장하지 않고 길이로 파생한다.
export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      (set) => ({
        cartIds: [],
        addToCart: (productId) =>
          set((state) =>
            // 같은 상품을 두 번 담아도 한 줄로 유지한다. 수량은 이번 범위 밖이다.
            state.cartIds.includes(productId) ? state : { cartIds: [...state.cartIds, productId] },
          ),
        removeFromCart: (productId) =>
          set((state) => ({ cartIds: state.cartIds.filter((id) => id !== productId) })),
      }),
      {
        // localStorage 키.
        name: "cart",
        version: 1,
        // 서버엔 저장소가 없어 자동 복원을 두면 첫 렌더가 어긋난다. 마운트 뒤 직접 복원한다.
        skipHydration: true,
        partialize: (state) => ({ cartIds: state.cartIds }),
        // 버전 불일치 시 통째로 버려지지 않게 sanitize로 복구한다.
        migrate: (persisted) => sanitize(persisted),
        merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
      },
    ),
    { name: "CartStore" },
  ),
);
