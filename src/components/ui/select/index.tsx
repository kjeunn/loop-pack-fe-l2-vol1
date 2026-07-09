// Select (Headless) — 4주차 1단계
//
// 요구사항 요약 (자세한 건 docs/assignments/week-04.md):
//   - 라이브러리/네이티브 <select> 없이 <div>/<ul> listbox로 직접 구현
//   - value는 문자열이 아니라 옵션 "객체 전체"
//   - 같은 로직으로 옵션 UI 3종(텍스트/썸네일/사이즈)을 렌더
//   - 키보드로 열기·이동(↑↓)·선택(Enter)·닫기(Esc)
//   - 품절 옵션은 키보드 이동에서 건너뛴다
//   - 각 옵션의 selected / highlighted / disabled 를 사용처가 알 수 있게 노출
//
// 공개 API(barrel): 헤드리스 훅·타입·변형 컴포넌트를 여기서 모아 내보낸다.
// 변형(TextSelect·ThumbnailSelect)은 만들면서 아래에 추가한다.
export { type SizeOption, SizeSelect } from "./SizeSelect";
export type { GetItemPropsArgs, UseSelectProps, UseSelectReturn } from "./types";
export { useSelect } from "./useSelect";
