import { z } from "zod";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { createCartSlice } from "@/entities/cart/model/cartSlice";
import type { RootStore } from "@/entities/commerce/model/types";
import { createWishlistSlice } from "@/entities/wishlist/model/wishlistSlice";

// 저장·복원 대상은 id 목록 둘뿐이다. action은 코드가 매번 새로 만드니 저장하지 않는다.
// 각 필드가 문자열 배열이 아니면(손댔거나 옛 구조) 그 배열을 통째로 비워 안전한 상태로 되돌린다.
const persistedCommerceSchema = z
  .object({
    cartIds: z.array(z.string()).catch([]),
    wishlistIds: z.array(z.string()).catch([]),
  })
  .catch({ cartIds: [], wishlistIds: [] });

type PersistedCommerce = z.infer<typeof persistedCommerceSchema>;

function sanitize(persisted: unknown): PersistedCommerce {
  return persistedCommerceSchema.parse(persisted);
}

// 장바구니와 위시리스트는 함께 저장·복원되어야 해서 한 store에 slice로 합친다.
// 저장 단위가 하나면 version·migrate도 한 벌이라 두 값이 서로 다른 버전으로 갈리지 않는다.
export const useCommerceStore = create<RootStore>()(
  devtools(
    persist(
      (...args) => ({
        ...createCartSlice(...args),
        ...createWishlistSlice(...args),
      }),
      {
        // localStorage 키.
        name: "commerce-store",
        version: 1,
        // 서버에는 저장소가 없어 자동 복원을 두면 서버와 클라이언트의 첫 렌더가 어긋난다.
        // 마운트 뒤에 직접 복원해 hydration 시점을 통제한다.
        skipHydration: true,
        // 저장할 조각만 고른다. 저장에서 뺄 slice가 생기면 여기서 제외한다.
        partialize: (state) => ({ cartIds: state.cartIds, wishlistIds: state.wishlistIds }),
        // 저장 버전이 다를 때만 실행된다. 지금은 v1이 기준이라 옛 버전이 없지만,
        // 구조가 바뀌면(예: id 배열 → {id, qty}) 버전을 올리고 변환을 여기에 더한다.
        // migrate가 없으면 버전 불일치 시 저장값이 통째로 버려지므로, sanitize로 최소한 복구한다.
        migrate: (persisted) => sanitize(persisted),
        // 버전이 같아도 항상 실행된다. 손상된 저장값을 걸러 안전한 상태로 복원한다.
        merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
      },
    ),
    // Redux DevTools에 표시될 store 이름(위 localStorage 키와 별개다).
    { name: "CommerceStore" },
  ),
);
