// [분리 근거] 페이지네이션 UI와 "표시할 페이지 번호 창" 계산을 담당.
// page/totalPages/onPageChange만 받고, 노출 번호 목록은 스스로 파생한다.
// 페이지가 1개뿐이면 아무것도 렌더하지 않아, 호출부가 조건 분기를 들 필요가 없다.
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// 현재 페이지 양옆에 함께 노출할 페이지 버튼 수 (MUI Pagination의 siblingCount와 같은 개념)
const SIBLING_COUNT = 2;

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const startPage = Math.max(1, page - SIBLING_COUNT);
  const endPage = Math.min(totalPages, page + SIBLING_COUNT);
  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  return (
    <nav className="pagination">
      <button onClick={() => onPageChange(1)} disabled={page === 1} aria-label="첫 페이지">
        «
      </button>
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="이전 페이지">
        ‹
      </button>
      {pageNumbers.map((p) => (
        <button key={p} className={p === page ? "active" : ""} onClick={() => onPageChange(p)}>
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="다음 페이지"
      >
        ›
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
        aria-label="마지막 페이지"
      >
        »
      </button>
    </nav>
  );
}
