import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { createCartSlice } from "@/entities/cart/model/cartSlice";
import type { RootStore } from "@/entities/commerce/model/types";
import { createWishlistSlice } from "@/entities/wishlist/model/wishlistSlice";

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
        name: "commerce-store",
        version: 1,
        // 서버에는 저장소가 없어 자동 복원을 두면 서버와 클라이언트의 첫 렌더가 어긋난다.
        // 마운트 뒤에 직접 복원해 hydration 시점을 통제한다.
        skipHydration: true,
      },
    ),
    { name: "commerce-store" },
  ),
);
