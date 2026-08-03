import { Header } from "@/widgets/header/ui/Header";

import "@/shared/ui/week-05-layout.css";

// 커머스 route group 공통 레이아웃. 헤더를 한 번만 렌더해 라우트 전환에도 유지한다.
// `(commerce)` 그룹이라 URL에 영향이 없고, 그룹 밖 /demo에는 헤더가 붙지 않는다.
// `.week05-page`를 여기에 두어 Header와 페이지 본문이 같은 스코프에 들어가고,
// 그 안의 focus-visible 스타일이 헤더·필터 모두에 적용된다.
export default function CommerceLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="week05-page">
      <Header />
      {children}
    </main>
  );
}
