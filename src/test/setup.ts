// toBeInTheDocument 같은 DOM 매처를 vitest의 expect에 붙인다(+ 타입 augmentation).
import "@testing-library/jest-dom/vitest";

// jsdom엔 레이아웃 엔진이 없어 scrollIntoView가 구현돼 있지 않다. noop으로 채운다.
Element.prototype.scrollIntoView = () => {};
