// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CommerceLayout from "./layout";

// (commerce) 그룹 공통 레이아웃이 헤더를 한 번 렌더하고 페이지 본문(children)을 그 안에 그린다.
// 헤더가 여기 있어야 라우트 전환에도 유지되고, 그룹 밖 /demo에는 붙지 않는다(폴더 구조로 보장).
describe("(commerce) layout", () => {
  it("헤더와 페이지 본문을 함께 렌더한다", () => {
    render(
      <CommerceLayout>
        <div>페이지 본문</div>
      </CommerceLayout>,
    );

    expect(screen.getByRole("link", { name: "상품" })).toBeInTheDocument();
    expect(screen.getByText("페이지 본문")).toBeInTheDocument();
  });
});
