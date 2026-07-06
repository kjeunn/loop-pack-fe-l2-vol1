// [분리 근거] 가격→표시 문자열 변환(순수 함수). 특정 컴포넌트가 아니라
// 어디서나 재사용되는 포맷이라 UI에서 떼어 utils로 분리. JSX·상태에 의존하지 않는다.
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString()}원`;
}
