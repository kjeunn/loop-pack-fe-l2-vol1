"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";

// 타이핑이 멈춘 뒤에만 URL을 갱신해 글자마다 요청이 나가지 않게 한다.
const SEARCH_DEBOUNCE_MS = 300;

// 대기 중인 debounce 타이머를 취소한다. 입력·popstate·정리 세 시점에서 같은 정리를 하므로 공통화한다.
function clearTimer(ref: { current: ReturnType<typeof setTimeout> | null }) {
  if (ref.current) {
    clearTimeout(ref.current);
  }
}

interface ProductSearchInputProps {
  value: string;
  onSearch: (value: string) => void;
}

export function ProductSearchInput({ value, onSearch }: ProductSearchInputProps) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 직전 value 변경이 뒤로/앞으로(popstate) 때문인지 표시한다.
  // 우리 검색 commit은 pushState라 popstate를 쏘지 않으므로, 이 플래그로 둘을 가른다.
  const pendingPopStateRef = useRef(false);
  // input 리마운트 트리거. popstate로 URL이 바뀔 때만 올려 IME 조합 버퍼까지 새로 만든다.
  const [remountKey, setRemountKey] = useState(0);

  // 뒤로/앞으로 네비게이션을 표시만 해둔다. 실제 리마운트는 value가 갱신된 뒤 아래 effect에서 한다.
  useEffect(() => {
    const handlePopState = () => {
      pendingPopStateRef.current = true;
      // 뒤로/앞으로 직후 대기 중이던 debounce가 발화하면 stale 검색어가 URL에 push되므로 여기서 즉시 취소한다.
      // value 변경 effect의 cleanup만으로는 popstate와 타이머 사이 경합 창이 남아,
      // input은 이동한 값으로 리마운트되는데 URL만 옛 입력값으로 갈라질 수 있다.
      clearTimer(debounceTimerRef);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    // popstate로 URL이 바뀐 경우에만 input을 리마운트한다.
    // 이 effect는 value가 갱신된 뒤 실행되므로 새 value로 리마운트돼 옛 값·조합 버퍼가 남지 않는다.
    // 우리 검색 commit은 popstate가 없어 리마운트되지 않고 포커스가 유지된다.
    if (pendingPopStateRef.current) {
      pendingPopStateRef.current = false;
      setRemountKey((key) => key + 1);
    }

    // 대기 중 debounce 취소. 언마운트 + 외부 URL 변경 모두에서 정리돼,
    // 뒤로 간 뒤 남은 타이머가 옛 검색어를 다시 push하지 않게 한다.
    return () => clearTimer(debounceTimerRef);
  }, [value]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    // 사용자가 타이핑하면 직전 popstate 기대는 무효로 둔다(같은 조건으로 back한 뒤 타이핑하는 경우 대비).
    pendingPopStateRef.current = false;

    const nextValue = event.target.value;
    clearTimer(debounceTimerRef);
    debounceTimerRef.current = setTimeout(() => onSearch(nextValue), SEARCH_DEBOUNCE_MS);
  }

  return (
    <label>
      검색
      {/* 언컨트롤드(defaultValue) + popstate 때만 바뀌는 key.
          타이핑·자기 commit엔 remountKey가 안 변해 포커스 유지,
          뒤로/앞으로일 때만 리마운트해 IME 버퍼를 초기화한다. */}
      <input
        key={remountKey}
        defaultValue={value}
        name="q"
        placeholder="상품명 또는 브랜드"
        onChange={handleChange}
      />
    </label>
  );
}
