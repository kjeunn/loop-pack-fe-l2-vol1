// [분리 근거] 검색어 강조는 순수 표현 로직. 카드 렌더 본문에 인라인으로 있던 것을
// 재사용 가능한 표현 컴포넌트로 뺀다. 정규식 escape도 같은 관심사라 함께 둔다.

// 검색어를 정규식에 안전하게 넣기 위한 escape (특수문자로 인한 RegExp 크래시 방지)
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// prop을 searchQuery가 아니라 query로 둔 이유: 이 컴포넌트는 '검색'이라는 개념을 모른다.
// 주어진 문자열(query)을 text에서 강조할 뿐이라, 호출자 도메인(search)이 아닌 자기 관심사로 이름 짓는다.
interface HighlightedTextProps {
  text: string;
  query: string;
}

export function HighlightedText({ text, query }: HighlightedTextProps) {
  if (!query) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} style={{ background: "#fff176", padding: 0 }}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
