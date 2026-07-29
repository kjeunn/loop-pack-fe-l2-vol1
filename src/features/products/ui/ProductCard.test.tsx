import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { useCommerceStore } from "@/entities/commerce/model/commerceStore";
import { ProductCard } from "@/features/products/ui/ProductCard";
import type { Product } from "@/types/commerce";

const product = {
  id: "p1",
  brand: "브랜드",
  name: "상품",
  category: "casual",
  price: 10000,
  originalPrice: null,
  image: "/images/products/p1.jpg",
  freeShipping: false,
  sizes: [],
  rating: 0,
  reviewCount: 0,
  createdAt: "2024-01-01",
} satisfies Product;

beforeEach(() => {
  useCommerceStore.setState({ cartIds: [], wishlistIds: [] });
});

describe("ProductCard 담기 버튼", () => {
  it("누르면 담기고, 다시 누르면 취소된다", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={product} />);

    const cartButton = screen.getByRole("button", { name: `${product.name} 장바구니` });
    expect(cartButton).toHaveAttribute("aria-pressed", "false");

    await user.click(cartButton);
    expect(cartButton).toHaveAttribute("aria-pressed", "true");

    await user.click(cartButton);
    expect(cartButton).toHaveAttribute("aria-pressed", "false");
  });
});

// 홈과 목록은 같은 store를 구독한다. 같은 상품의 카드를 두 곳에서 그려도 상태가 일치해야 한다.
describe("홈·목록의 같은 상품 상태 일치", () => {
  it("한 화면에서 담으면 다른 화면의 같은 상품도 담긴 상태가 된다", async () => {
    const user = userEvent.setup();
    render(
      <>
        <div aria-label="home">
          <ProductCard product={product} />
        </div>
        <div aria-label="list">
          <ProductCard product={product} />
        </div>
      </>,
    );

    const [homeCart, listCart] = screen.getAllByRole("button", {
      name: `${product.name} 장바구니`,
    });

    await user.click(homeCart);

    expect(homeCart).toHaveAttribute("aria-pressed", "true");
    expect(listCart).toHaveAttribute("aria-pressed", "true");
  });
});
