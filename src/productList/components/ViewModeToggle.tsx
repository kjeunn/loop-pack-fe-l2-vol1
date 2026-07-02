// [분리 근거] 그리드/리스트 보기 전환 select 하나만 담당.
interface ViewModeToggleProps {
  viewMode: "grid" | "list";
  onViewModeChange: (viewMode: "grid" | "list") => void;
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <select value={viewMode} onChange={(e) => onViewModeChange(e.target.value as "grid" | "list")}>
      <option value="grid">그리드</option>
      <option value="list">리스트</option>
    </select>
  );
}
