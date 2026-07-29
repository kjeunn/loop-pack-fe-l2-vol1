import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useCommerceStore } from "@/entities/commerce/model/commerceStore";
import { Header } from "@/widgets/header/ui/Header";

beforeEach(async () => {
  localStorage.clear();
  // 헤더는 복원 완료 후에만 개수를 보여준다. 복원을 먼저 끝내 그 이후 상태를 검증한다.
  await useCommerceStore.persist.rehydrate();
  useCommerceStore.setState({ cartIds: [], wishlistIds: [] });
});

// 헤더 개수는 별도 저장이 아니라 store id 목록에서 파생된다.
describe("헤더 개수 파생", () => {
  it("담고 찜하면 헤더 개수가 따라 바뀐다", () => {
    render(<Header />);

    expect(screen.getByText("장바구니 0")).toBeInTheDocument();
    expect(screen.getByText("위시리스트 0")).toBeInTheDocument();

    act(() => {
      useCommerceStore.getState().addToCart("p1");
      useCommerceStore.getState().addToCart("p2");
      useCommerceStore.getState().toggleWishlist("p3");
    });

    expect(screen.getByText("장바구니 2")).toBeInTheDocument();
    expect(screen.getByText("위시리스트 1")).toBeInTheDocument();
  });
});
