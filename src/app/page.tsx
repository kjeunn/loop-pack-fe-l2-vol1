import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton/Skeleton";

import { getProductOptions } from "./api/products/data";
import { SelectDemo } from "./SelectDemo";

// 데이터를 await하는 서버 컴포넌트. 느린 소스면 이 await 동안 아래 Suspense fallback이 스트리밍된다.
async function SelectSection() {
  const options = await getProductOptions();
  return <SelectDemo options={options} />;
}

function LoadingSkeletons() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-[560px] px-6 py-16">
      <h1 className="mb-6 text-2xl font-extrabold">Select 데모</h1>

      {/* 데이터 로딩은 서버가 하고, 느리면 Suspense가 스켈레톤을 먼저 스트리밍한다. */}
      <Suspense fallback={<LoadingSkeletons />}>
        <SelectSection />
      </Suspense>
    </main>
  );
}
