"use client";

import { useState } from "react";

import {
  type SizeOption,
  SizeSelect,
  type TextOption,
  TextSelect,
  type ThumbnailOption,
  ThumbnailSelect,
} from "@/components/ui/select";

import type { ProductOptions } from "./api/products/data";

// 데이터는 서버가 준다(props). 여기선 상호작용(선택 상태)만 담당한다.
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
