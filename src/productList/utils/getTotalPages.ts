// [분리 근거] 총 개수와 페이지 크기로 전체 페이지 수를 구하는 순수 계산.
// 빈 목록에서도 최소 1페이지를 보장한다(페이지네이션 계산이 깨지지 않도록).
export function getTotalPages(totalCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}
