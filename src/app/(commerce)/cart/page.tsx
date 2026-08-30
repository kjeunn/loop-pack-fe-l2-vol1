import { CartList } from "@/features/cart/ui/CartList";

// 공개 경로(proxy 매처 밖). 익명도 담은 상품을 확인할 수 있다.
export default function CartPage() {
  return (
    <section>
      <h1>장바구니</h1>
      <CartList />
    </section>
  );
}
