"use client";

import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";

import { productListQueryOptions } from "@/features/products/api/queries";
import { productSearchParsers } from "@/features/products/model/searchParams";
import { ProductCard } from "@/features/products/ui/ProductCard";
import { ProductGridSkeleton } from "@/features/products/ui/ProductSkeleton";

// 목록의 로딩·에러·빈·성공 네 상태를 그린다.
// 조회 조건도 결과도 스스로 읽는다. 부모와 같은 query key라 캐시를 공유해 요청은 한 번만 나간다.
export function ProductListResults() {
  const [query] = useQueryStates(productSearchParsers);
  const { data, isLoading, isError, error } = useQuery(productListQueryOptions(query));

  if (isLoading) {
    return <ProductGridSkeleton count={query.pageSize} />;
  }

  if (isError) {
    return <p role="alert">{error.message}</p>;
  }

  const products = data?.products;

  if (!products || products.length === 0) {
    // 조건에 맞는 상품이 있는데 목록만 비었다면 page가 마지막을 넘은 것이다.
    // 뷰가 곧 첫 페이지로 되돌려 다시 조회하므로, 사실과 다른 문구 대신 로딩을 유지한다.
    if (data && data.totalCount > 0) {
      return <ProductGridSkeleton count={query.pageSize} />;
    }
    return <p>조건에 맞는 상품이 없습니다.</p>;
  }

  return (
    <>
      <p>총 {data.totalCount}개</p>
      <div className="week05-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
