import { cache } from "react";

import { makeQueryClient } from "@/shared/api/queryClient";

import "server-only";

// 요청마다 하나의 QueryClient. cache로 같은 요청 안에서는 prefetch와 dehydrate가 같은 인스턴스를 쓰고,
// 요청이 다르면 새로 만들어져 사용자 간 캐시가 섞이지 않는다.
export const getServerQueryClient = cache(makeQueryClient);
