"use client";

import { useState } from "react";

import type { ProductOptions } from "@/features/product-options/api/products";
import type {
  SizeOption,
  TextOption,
  ThumbnailOption,
} from "@/features/product-options/model/types";
import { SizeSelect } from "@/features/product-options/ui/SizeSelect";
import { TextSelect } from "@/features/product-options/ui/TextSelect";
import { ThumbnailSelect } from "@/features/product-options/ui/ThumbnailSelect";

// page(서버)가 준 데이터로 3종 select를 조립하고 선택 상태를 관리한다.
// 페이지 전용 조합(프리미티브 아님)이라 views/demo에 둔다.
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
