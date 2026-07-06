// [분리 근거] 검색어 입력 하나만 담당. 값과 변경 콜백만 받는 표현 컴포넌트.
interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function SearchBar({ searchQuery, onSearchChange }: SearchBarProps) {
  return (
    <input
      type="search"
      placeholder="상품 검색..."
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      className="search-input"
    />
  );
}
