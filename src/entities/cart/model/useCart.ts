import { useCommerceStore } from "@/entities/commerce/model/commerceStore";
import type { Product } from "@/types/commerce";

// 개수는 저장하지 않고 id 배열 길이로 파생한다. number라 참조가 안정적이라 useShallow가 필요 없다.
export function useCartCount() {
  return useCommerceStore((state) => state.cartIds.length);
}

// 카드는 자기 상품의 포함 여부만 구독한다. 다른 상품이 담겨도 이 값이 안 바뀌면 리렌더되지 않는다.
export function useIsInCart(productId: Product["id"]) {
  return useCommerceStore((state) => state.cartIds.includes(productId));
}

export function useAddToCart() {
  return useCommerceStore((state) => state.addToCart);
}

export function useRemoveFromCart() {
  return useCommerceStore((state) => state.removeFromCart);
}
