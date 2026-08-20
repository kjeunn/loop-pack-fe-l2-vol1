// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useCartStore } from "@/entities/cart/model/cartStore";
import { useWishlistStore } from "@/entities/wishlist/model/wishlistStore";
import { Header } from "@/widgets/header/ui/Header";

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ cartIds: [] });
  useWishlistStore.setState({ wishlistIds: [] });
});

// 복원이 한 번도 일어나지 않은 상태를 검증하려고 이 describe를 먼저 둔다.
// hasHydrated는 모듈 싱글턴이라 다른 테스트가 복원하면 되돌릴 수 없다.
describe("헤더 하이드레이션 게이트", () => {
  it("복원 전에는 개수 대신 로딩을 보이고, 복원 후 개수가 나타난다", async () => {
    render(<Header />);

    // skipHydration이라 복원 전엔 잘못된 0 대신 Skeleton — 개수 span이 없다.
    expect(screen.queryByText(/장바구니 \d/)).not.toBeInTheDocument();
    expect(screen.queryByText(/위시리스트 \d/)).not.toBeInTheDocument();

    await act(async () => {
      await useCartStore.persist.rehydrate();
      await useWishlistStore.persist.rehydrate();
    });

    expect(screen.getByText("장바구니 0")).toBeInTheDocument();
    expect(screen.getByText("위시리스트 0")).toBeInTheDocument();
  });
});

// 헤더 개수는 별도 저장이 아니라 store id 목록에서 파생된다.
describe("헤더 개수 파생", () => {
  // 이 그룹은 복원이 끝난 상태를 전제한다. 복원을 먼저 끝내 그 이후 개수를 검증한다.
  beforeEach(async () => {
    await useCartStore.persist.rehydrate();
    await useWishlistStore.persist.rehydrate();
    useCartStore.setState({ cartIds: [] });
    useWishlistStore.setState({ wishlistIds: [] });
  });

  it("담고 찜하면 헤더 개수가 따라 바뀐다", () => {
    render(<Header />);

    expect(screen.getByText("장바구니 0")).toBeInTheDocument();
    expect(screen.getByText("위시리스트 0")).toBeInTheDocument();

    act(() => {
      useCartStore.getState().addToCart("p1");
      useCartStore.getState().addToCart("p2");
      useWishlistStore.getState().toggleWishlist("p3");
    });

    expect(screen.getByText("장바구니 2")).toBeInTheDocument();
    expect(screen.getByText("위시리스트 1")).toBeInTheDocument();
  });

  it("담았다 다시 빼면 헤더 개수가 줄어든다", () => {
    render(<Header />);

    act(() => {
      useCartStore.getState().addToCart("p1");
      useCartStore.getState().addToCart("p2");
    });
    expect(screen.getByText("장바구니 2")).toBeInTheDocument();

    act(() => {
      useCartStore.getState().removeFromCart("p1");
    });
    expect(screen.getByText("장바구니 1")).toBeInTheDocument();
  });
});
