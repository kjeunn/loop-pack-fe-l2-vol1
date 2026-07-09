"use client";

import { useEffect, useState } from "react";

import {
  type SizeOption,
  SizeSelect,
  type ThumbnailOption,
  ThumbnailSelect,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";

interface OptionsResponse {
  sizeOptions: SizeOption[];
  thumbnailOptions: ThumbnailOption[];
}

export default function Home() {
  const [sizeOptions, setSizeOptions] = useState<SizeOption[]>([]);
  const [thumbnailOptions, setThumbnailOptions] = useState<ThumbnailOption[]>([]);
  const [size, setSize] = useState<SizeOption | null>(null);
  const [thumbnail, setThumbnail] = useState<ThumbnailOption | null>(null);
  // 초기값 loading이라 effect에서 동기 setState를 안 해도 된다(set-state-in-effect 회피).
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    // 옵션은 한 번만 fetch해 state에 보관한다(참조 안정 → 선택 참조 비교가 유지됨).
    let ignore = false;
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: OptionsResponse) => {
        if (ignore) return;
        setSizeOptions(data.sizeOptions);
        setThumbnailOptions(data.thumbnailOptions);
        setStatus("success");
      })
      .catch(() => {
        if (!ignore) setStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-[560px] px-6 py-16">
      <h1 className="mb-6 text-2xl font-extrabold">Select 데모</h1>

      {status === "loading" && (
        <div className="space-y-6">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      )}
      {status === "error" && <p className="text-red-500">옵션을 불러오지 못했습니다.</p>}

      {status === "success" && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-500">사이즈</h2>
            <SizeSelect label="사이즈" options={sizeOptions} value={size} onChange={setSize} />
            <p className="mt-2 text-sm text-gray-500">
              선택: {size ? `${size.size} (재고 ${size.stock})` : "없음"}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-500">썸네일</h2>
            <ThumbnailSelect
              label="옵션을 선택해 주세요"
              options={thumbnailOptions}
              value={thumbnail}
              onChange={setThumbnail}
            />
            <p className="mt-2 text-sm text-gray-500">
              선택:{" "}
              {thumbnail ? `${thumbnail.title} — ${thumbnail.price.toLocaleString()}원` : "없음"}
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
