import { twMerge } from "tailwind-merge";

// 기본 클래스 + 소비자 className을 병합한다. 충돌하는 Tailwind 클래스는 뒤(소비자) 것이 이긴다.
// → "기본 디자인을 두되 사용처가 언제든 override"가 안정적으로 동작한다.
export function cn(...classes: (string | undefined | false | null)[]) {
  return twMerge(classes.filter(Boolean).join(" "));
}
