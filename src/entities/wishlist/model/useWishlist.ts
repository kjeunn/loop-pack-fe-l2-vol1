import { useWishlistStore } from "@/entities/wishlist/model/wishlistStore";
import { useHasHydrated, useRehydrate } from "@/shared/lib/persist/hydration";

export function useWishlistCount() {
  return useWishlistStore((state) => state.wishlistIds.length);
}

export function useIsWishlisted(productId: string) {
  return useWishlistStore((state) => state.wishlistIds.includes(productId));
}

export function useToggleWishlist() {
  return useWishlistStore((state) => state.toggleWishlist);
}

export function useWishlistHydrated() {
  return useHasHydrated(useWishlistStore);
}

export function useHydrateWishlist() {
  useRehydrate(useWishlistStore);
}
