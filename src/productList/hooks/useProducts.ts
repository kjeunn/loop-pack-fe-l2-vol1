// [분리 근거] 서버 상태(상품 목록·총개수·로딩·에러)와 로딩 effect를 한 곳에 모은다.
// 컴포넌트는 "무엇을 보여줄지"만 알고 "언제·어떻게 불러오는지"는 이 hook이 책임진다.
// 통신은 service(productApi)에만 의존하고 fetch를 직접 다루지 않는다(DIP).
import { useEffect, useState } from "react";

import { fetchProducts, type ProductQuery } from "../services/productApi";
import type { Product } from "../types";

export function useProducts({
  category,
  sortBy,
  searchQuery,
  page,
  pageSize,
  minPrice,
  maxPrice,
  inStockOnly,
}: ProductQuery) {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // 첫 로딩(한 번도 못 불러온 상태)과 갱신 로딩을 구분하기 위한 플래그.
  const [hasLoaded, setHasLoaded] = useState(false);
  // retry가 증가시키는 트리거. 쿼리가 그대로여도 effect를 다시 돌려 재요청하게 한다.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchProducts({
          category,
          sortBy,
          searchQuery,
          page,
          pageSize,
          minPrice,
          maxPrice,
          inStockOnly,
        });
        setProducts(data.products);
        setTotalCount(data.totalCount);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
        setHasLoaded(true);
      }
    };
    loadProducts();
  }, [category, minPrice, maxPrice, sortBy, searchQuery, page, pageSize, inStockOnly, reloadKey]);

  // 아직 첫 결과를 못 받은 상태(로드 전 + 첫 로딩 중).
  // 마운트 첫 렌더부터 true라 첫 로딩 화면이 곧바로 떠서, 결과 도착 전 빈 화면이 잠깐 비치지 않는다.
  const isInitialLoading = !hasLoaded;

  // retry: reloadKey를 바꿔 effect를 다시 돌린다(새로고침 없이 같은 쿼리로 재요청 — 일시적 API 오류 복구용).
  const retry = () => setReloadKey((key) => key + 1);

  return { products, totalCount, isLoading, isInitialLoading, error, retry };
}
