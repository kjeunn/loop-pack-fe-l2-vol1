// [분리 근거] 값이 잠잠해질 때까지 갱신을 미루는 범용 디바운스 hook.
// "타이핑 중엔 반영 안 하고 멈추면 반영"처럼, 즉시값과 소비값을 분리해야 하는 곳에서 재사용한다.
import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  // 외부 값 변경을 타이머로 지연 반영하는 동기화 → effect의 정당한 용도.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
