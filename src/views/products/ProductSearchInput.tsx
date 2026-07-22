"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";

// 타이핑이 멈춘 뒤에만 URL을 갱신해 글자마다 요청이 나가지 않게 한다.
const SEARCH_DEBOUNCE_MS = 300;

interface ProductSearchInputProps {
  value: string;
  onSearch: (value: string) => void;
}

export function ProductSearchInput({ value, onSearch }: ProductSearchInputProps) {
  const [draft, setDraft] = useState(value);
  const [lastSyncedValue, setLastSyncedValue] = useState(value);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 뒤로 가기처럼 URL이 밖에서 바뀌면 입력창도 그 값으로 되돌려야 한다.
  // key로 리마운트하면 타이핑 중 포커스를 잃으므로 렌더 중에 조정한다.
  if (value !== lastSyncedValue) {
    setLastSyncedValue(value);
    setDraft(value);
  }

  // 확정 전에 화면을 벗어나면 죽은 타이머가 setQuery를 호출한다.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextDraft = event.target.value;
    setDraft(nextDraft);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => onSearch(nextDraft), SEARCH_DEBOUNCE_MS);
  }

  return (
    <label>
      검색
      <input name="q" placeholder="상품명 또는 브랜드" value={draft} onChange={handleChange} />
    </label>
  );
}
