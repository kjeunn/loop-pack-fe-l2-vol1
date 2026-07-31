import type { SlicePattern } from "@/entities/commerce/model/types";

type ProductId = string;

export interface CartSlice {
  cartIds: ProductId[];
  addToCart: (productId: ProductId) => void;
  removeFromCart: (productId: ProductId) => void;
}

// 담은 상품은 id만 갖는다. 이름·가격 같은 나머지는 서버 응답이 소유하므로,
// 여기에 복사해 두면 두 곳의 값이 어긋난다. 개수도 저장하지 않고 길이로 파생한다.
export const createCartSlice: SlicePattern<CartSlice> = (set) => ({
  cartIds: [],

  addToCart: (productId) =>
    set((state) =>
      // 같은 상품을 두 번 담아도 한 줄로 유지한다. 수량은 이번 범위 밖이다.
      state.cartIds.includes(productId) ? state : { cartIds: [...state.cartIds, productId] },
    ),

  removeFromCart: (productId) =>
    set((state) => ({ cartIds: state.cartIds.filter((id) => id !== productId) })),
});
