import type { StateCreator } from "zustand";

import type { CartSlice } from "@/entities/cart/model/cartSlice";
import type { WishlistSlice } from "@/entities/wishlist/model/wishlistSlice";

export type RootStore = CartSlice & WishlistSlice;

// slice가 공유하는 타입 계약.
// 첫 인자를 전체 store로 둬 slice에서 다른 slice의 상태도 읽게 하고,
// 미들웨어 뮤테이터를 여기 한 곳에 적어 미들웨어를 바꿔도 각 slice는 그대로 둔다.
export type SlicePattern<T, S = RootStore> = StateCreator<
  S,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  T
>;
