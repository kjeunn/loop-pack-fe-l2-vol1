import { useCommerceStore } from "@/entities/commerce/model/commerceStore";

export function useWishlistCount() {
  return useCommerceStore((state) => state.wishlistIds.length);
}

export function useIsWishlisted(productId: string) {
  return useCommerceStore((state) => state.wishlistIds.includes(productId));
}

export function useToggleWishlist() {
  return useCommerceStore((state) => state.toggleWishlist);
}
