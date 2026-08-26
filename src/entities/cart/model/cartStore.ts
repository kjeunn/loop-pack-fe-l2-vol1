import { z } from "zod";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type ProductId = string;

export type CartStore = {
  cartIds: ProductId[];
  addToCart: (productId: ProductId) => void;
  removeFromCart: (productId: ProductId) => void;
  clearCart: () => void;
};

// 저장값은 id 목록뿐. 문자열 배열이 아니면(손댔거나 옛 구조) 비워 안전한 상태로 되돌린다.
const persistedCartSchema = z
  .object({ cartIds: z.array(z.string()).catch([]) })
  .catch({ cartIds: [] });
// 저장값 복구는 우리 로직이라 sync 단위로 직접 검증한다(export). rehydrate(비동기 배선)로 돌리면
// Stryker에서 변형이 hang→timeout으로 걸려 총점이 흔들리기 때문이다.
export const sanitize = (persisted: unknown) => persistedCartSchema.parse(persisted);

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
        clearCart: () => set({ cartIds: [] }),
      }),
      // zustand persist 배선(skipHydration·migrate·merge 등)은 라이브러리 몫이라 §9 신뢰 경계다.
      // 변형하면 async rehydrate 테스트가 hang→timeout으로 걸려 Stryker 총점을 흔들어 변형에서 뺀다.
      // 우리 로직 sanitize·리듀서는 이 블록 밖에서 변형·검증된다.
      // Stryker disable all
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
      // Stryker restore all
    ),
    { name: "CartStore" },
  ),
);
