import type { SlicePattern } from "@/entities/commerce/model/types";
import type { Product } from "@/types/commerce";

type ProductId = Product["id"];

export interface WishlistSlice {
  wishlistIds: ProductId[];
  toggleWishlist: (productId: ProductId) => void;
}

// 찜은 켜고 끄는 한 가지 동작뿐이라 add·remove를 나누지 않고 toggle 하나로 둔다.
export const createWishlistSlice: SlicePattern<WishlistSlice> = (set) => ({
  wishlistIds: [],

  toggleWishlist: (productId) =>
    set((state) => ({
      wishlistIds: state.wishlistIds.includes(productId)
        ? state.wishlistIds.filter((id) => id !== productId)
        : [...state.wishlistIds, productId],
    })),
});
