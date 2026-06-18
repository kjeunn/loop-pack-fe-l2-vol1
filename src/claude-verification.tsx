// src/claude-verification.tsx
import { useState, useEffect } from "react";

export function ClaudeVerificationComponent() {
  // ❌ 위반 1 (품질 기준 1번): 모호한 변수명 'data', 'flag' 사용
  const [data, setData] = useState<any>(null);
  const flag = true;

  // ❌ 위반 2 (품질 기준 3번): useState + useEffect를 통한 상태 중복 동기화 (파생 값 계산 위반)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fullName, setFullName] = useState("");
  useEffect(() => {
    setFullName(`${firstName} ${lastName}`);
  }, [firstName, lastName]);

  // ❌ 위반 3 (🚫 금지 사항): 기계가 자동 차단하는 빈 catch문 방치 (no-empty)
  try {
    const doubleFlag = flag * 2;
  } catch (e) {
    // 에러를 침묵시킴
  }

  // ❌ 위반 4 (🚫 금지 사항): AI 절대 금지 코드인 우회 주석 사용
  // eslint-disable-next-line
  const N = 10;

  return <div>{fullName}</div>;
}
