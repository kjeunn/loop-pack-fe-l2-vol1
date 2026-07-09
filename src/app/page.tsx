import { Suspense } from "react";

import { DialogDemo } from "@/components/dialog-demo/DialogDemo";
import { SelectDemo } from "@/components/select-demo/SelectDemo";
import { SelectDemoSkeleton } from "@/components/select-demo/SelectDemoSkeleton";
import { getProductOptions } from "@/server/products";

// 데이터를 await하는 서버 컴포넌트. 느린 소스면 이 await 동안 아래 Suspense fallback이 스트리밍된다.
async function SelectSection() {
  const options = await getProductOptions();
  return <SelectDemo options={options} />;
}

export default function Home() {
  return (
    <main className="mx-auto max-w-[560px] space-y-16 px-6 py-16">
      <section>
        <h1 className="mb-6 text-2xl font-extrabold">Select</h1>
        {/* 데이터 로딩은 서버가 하고, 느리면 Suspense가 스켈레톤을 먼저 스트리밍한다. */}
        <Suspense fallback={<SelectDemoSkeleton />}>
          <SelectSection />
        </Suspense>
      </section>

      <section>
        <h1 className="mb-6 text-2xl font-extrabold">Dialog</h1>
        <DialogDemo />
      </section>
    </main>
  );
}
