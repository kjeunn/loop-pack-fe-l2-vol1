// 페이지 크기 상수. 서버 컴포넌트도 읽으므로 클라이언트 전용인 nuqs에 기대지 않는다.

// 그리드가 데스크톱에서 5열이라 5의 배수가 행을 채운다. API 상한은 24라 그 아래로 둔다.
export const PAGE_SIZE_VALUES = [10, 15, 20] as const;

export type PageSize = (typeof PAGE_SIZE_VALUES)[number];

export const DEFAULT_PAGE_SIZE = 10;
