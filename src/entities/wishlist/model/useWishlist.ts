import { useCommerceStore } from "@/entities/commerce/model/commerceStore";
import type { Product } from "@/types/commerce";

export function useWishlistCount() {
  return useCommerceStore((state) => state.wishlistIds.length);
}

export function useIsWishlisted(productId: Product["id"]) {
  return useCommerceStore((state) => state.wishlistIds.includes(productId));
}

export function useToggleWishlist() {
  return useCommerceStore((state) => state.toggleWishlist);
}
