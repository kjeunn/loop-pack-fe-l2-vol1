import { Suspense } from "react";

import { DialogDemo } from "@/_pages/demo/dialog/DialogDemo";
import { SelectDemo } from "@/_pages/demo/select/SelectDemo";
import { SelectDemoSkeleton } from "@/_pages/demo/select/SelectDemoSkeleton";
import { getProductOptions } from "@/features/product-options/api/products";

// 데이터를 await하는 서버 컴포넌트. 느린 소스면 이 await 동안 Suspense fallback이 스트리밍된다.
async function SelectSection() {
  const options = await getProductOptions();
  return <SelectDemo options={options} />;
}

// Select·Dialog 데모를 한 화면에 조합하는 뷰. app은 라우팅만 두고 조합은 _pages가 소유한다.
export function DemoView() {
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
