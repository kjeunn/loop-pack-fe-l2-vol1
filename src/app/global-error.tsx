"use client";

// root layout 자체의 에러를 잡는 최종 경계. error.tsx는 layout 안에서 렌더돼 root layout 에러는
// 못 잡으므로, 그 자리를 이 파일이 맡는다(그룹 밖 라우트 에러는 root error.tsx가 먼저 잡음).
// root layout을 대체하므로 <html>·<body>를 직접 렌더하고, globals.css에 의존하지 않도록
// 최소 인라인 스타일만 쓴다(에러 상황에서 스타일 로드까지 실패해도 읽히게).
interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="ko">
      <body>
        <section
          style={{
            maxWidth: 560,
            margin: "0 auto",
            padding: "64px 24px",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <p style={{ marginBottom: 16, color: "#374151" }}>
            문제가 발생했어요. 잠시 후 다시 시도해 주세요.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "#111827",
              color: "#fff",
              border: 0,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </section>
      </body>
    </html>
  );
}
