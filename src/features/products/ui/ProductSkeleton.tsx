import { Skeleton } from "@/shared/ui/loading/Skeleton";

// ProductCard와 같은 자리·같은 순서를 차지해 로딩과 성공 사이에 레이아웃이 흔들리지 않게 한다.
function ProductCardSkeleton() {
  return (
    <article className="week05-product">
      <Skeleton className="week05-image" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-20" />
      <div>
        <Skeleton className="h-9 w-12" />
        <Skeleton className="h-9 w-14" />
      </div>
    </article>
  );
}

interface ProductGridSkeletonProps {
  count: number;
}

// 카드 개수만 정하고 모양은 ProductCardSkeleton에 맡긴다.
export function ProductGridSkeleton({ count }: ProductGridSkeletonProps) {
  return (
    <div className="week05-grid">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
