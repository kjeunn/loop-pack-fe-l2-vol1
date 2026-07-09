import { Skeleton } from "@/components/ui/loading/Skeleton";

// SelectDemo의 로딩 폴백. 3종 select 자리를 같은 크기 스켈레톤으로 채워 레이아웃이 안 흔들리게 한다.
// (SelectDemo와 짝을 이루는 페이지 조합이라 ui 프리미티브와 구분해 여기 둔다.)
export function SelectDemoSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}
