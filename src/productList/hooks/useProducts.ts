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
}: ProductQuery) {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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
        });
        setProducts(data.products);
        setTotalCount(data.totalCount);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [category, minPrice, maxPrice, sortBy, searchQuery, page, pageSize]);

  return { products, totalCount, isLoading, error };
}
