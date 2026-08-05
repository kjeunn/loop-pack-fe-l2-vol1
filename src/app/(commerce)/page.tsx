import { Suspense } from "react";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { homeQueryOptions } from "@/_pages/home/api/queries";
import { HomeSkeleton } from "@/_pages/home/ui/HomeSkeleton";
import { HomeView } from "@/_pages/home/ui/HomeView";
import { getServerQueryClient } from "@/shared/api/getServerQueryClient";

// app은 라우팅만. 화면 조합은 _pages가 소유한다.
// 제목·설명 셸은 홈 데이터와 무관하므로 await 밖에서 즉시 렌더해 데이터 대기가 셸을 막지 않게 한다.
// 느린 데이터에 의존하는 본문만 Suspense로 감싸 스트리밍한다(fallback은 실제 높이의 스켈레톤).
export default function Home() {
  return (
    <>
      {/* h1은 느린 배너 데이터가 아니라 정적 문구로 둔다. 데이터와 무관해 즉시 렌더되고,
          빠른 초기 HTML에 담겨 크롤러가 일찍 읽으며, 실제 섹션(인기·신상품)을 설명해 SEO에 이롭다.
          동적 배너 제목은 hero의 h2로 남긴다. */}
      <section className="week05-section">
        <h1>지금 인기 있는 상품과 신상품</h1>
        <p>카테고리별 추천과 새로 들어온 상품을 한눈에 확인하세요.</p>
      </section>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </>
  );
}

// 홈 데이터를 서버에서 프리패치해 문서에 담고 dehydrate로 클라에 넘긴다(재요청 방지).
// await가 이 경계 안에서만 대기하므로 위 셸은 먼저 paint된다.
async function HomeContent() {
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(homeQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeView />
    </HydrationBoundary>
  );
}
