import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { homeQueryOptions } from "@/features/home/api/queries";
import { getServerQueryClient } from "@/shared/api/getServerQueryClient";
import { HomeView } from "@/views/home/HomeView";

// app은 라우팅만. 화면 조합은 views가 소유한다.
// 홈은 파라미터가 없고 배너·상품명이 첫 HTML에 담겨야 SEO에 이로워 서버에서 프리패치한다.
// await로 데이터를 초기 HTML에 넣고, dehydrate로 클라이언트에 넘겨 재요청을 막는다.
export default async function Home() {
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(homeQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeView />
    </HydrationBoundary>
  );
}
