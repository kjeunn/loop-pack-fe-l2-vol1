// [분리 근거] 정렬 옵션 선택 하나만 담당. 옵션 목록(SORT_OPTIONS)과 값/콜백을 다룬다.
import { SORT_OPTIONS } from "../constants";
import type { SortBy } from "../types";

interface SortSelectProps {
  sortBy: SortBy;
  onSortChange: (sortBy: SortBy) => void;
}

export function SortSelect({ sortBy, onSortChange }: SortSelectProps) {
  return (
    <select value={sortBy} onChange={(e) => onSortChange(e.target.value as SortBy)}>
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
