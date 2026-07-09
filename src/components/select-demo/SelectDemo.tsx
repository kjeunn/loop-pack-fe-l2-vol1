"use client";

import { useState } from "react";

import { type SizeOption, SizeSelect } from "@/components/ui/select/SizeSelect";
import { type TextOption, TextSelect } from "@/components/ui/select/TextSelect";
import { type ThumbnailOption, ThumbnailSelect } from "@/components/ui/select/ThumbnailSelect";
import type { ProductOptions } from "@/server/products";

// page(서버)가 준 데이터로 3종 select를 조립하고 선택 상태를 관리한다.
// 페이지 전용 조합(프리미티브 아님)이라 components/select-demo에 둔다.
interface SelectDemoProps {
  options: ProductOptions;
}

export function SelectDemo({ options }: SelectDemoProps) {
  const [text, setText] = useState<TextOption | null>(null);
  const [size, setSize] = useState<SizeOption | null>(null);
  const [thumbnail, setThumbnail] = useState<ThumbnailOption | null>(null);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">텍스트/가격</h2>
        <TextSelect
          label="옵션 선택"
          options={options.textOptions}
          value={text}
          onChange={setText}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">사이즈</h2>
        <SizeSelect label="사이즈" options={options.sizeOptions} value={size} onChange={setSize} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">썸네일</h2>
        <ThumbnailSelect
          label="옵션을 선택해 주세요"
          options={options.thumbnailOptions}
          value={thumbnail}
          onChange={setThumbnail}
        />
      </section>
    </div>
  );
}
