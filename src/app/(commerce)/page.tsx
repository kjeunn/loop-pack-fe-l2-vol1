import { Suspense } from "react";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";

import { homeQueryOptions } from "@/_pages/home/api/queries";
import { HomeSkeleton } from "@/_pages/home/ui/HomeSkeleton";
import { HomeView } from "@/_pages/home/ui/HomeView";
import { PreloadHero } from "@/examples/week-07-performance/PreloadHero";
import { getServerQueryClient } from "@/shared/api/getServerQueryClient";
import { makeQueryClient } from "@/shared/api/queryClient";
import { buildPageMetadata } from "@/shared/config/siteMetadata";

// 본문과 같은 query factory로 배너를 조회해 title·description·image를 metadata에 쓴다(체크리스트 258).
// 본문(HomeContent)과 별개 QueryClient라 캐시를 공유하지 않고, 같은 URL·options의 native fetch가
// request 안에서 memoization돼 Route Handler는 한 번만 호출된다(서버 로그로 확인).
export async function generateMetadata(): Promise<Metadata> {
  try {
    const home = await makeQueryClient().fetchQuery(homeQueryOptions());
    const { title, description, image } = home.banner;
    return buildPageMetadata({ title, description, image, url: "/" });
  } catch {
    return {};
  }
}

// app은 라우팅만. 화면 조합은 _pages가 소유한다.
// 제목·설명 셸은 홈 데이터와 무관하므로 await 밖에서 즉시 렌더해 데이터 대기가 셸을 막지 않게 한다.
// 느린 데이터에 의존하는 본문만 Suspense로 감싸 스트리밍한다(fallback은 실제 높이의 스켈레톤).
export default function Home() {
  return (
    <>
      {/* Hero(홈 LCP) 이미지를 셸에서 preload해 배너 데이터 대기 중에 받아둔다(load delay 제거).
          ReactDOM.preload는 Next 문서가 Client Component 패턴으로 안내해 PreloadHero로 분리했다. */}
      <PreloadHero />
      {/* 정적 h1·설명이라 느린 배너 데이터와 무관하게 즉시 렌더돼 초기 HTML에 담긴다(크롤러·SEO·스크린리더).
          다만 히어로의 배너 title·description과 시각적으로 겹쳐, sr-only로 시각만 숨기고 DOM엔 남긴다.
          최상단 비주얼은 히어로가 맡고, 동적 배너 제목은 hero의 h2로 남긴다. */}
      <section className="sr-only">
        <h1>Loopers 커머스 인기 상품과 신상품</h1>
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
