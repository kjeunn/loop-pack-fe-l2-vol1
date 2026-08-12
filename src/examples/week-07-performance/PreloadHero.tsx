"use client";

import { preload } from "react-dom";

import { getImageProps } from "next/image";

import { HERO_IMAGE } from "@/examples/week-07-performance/HeroSection";

// Hero(홈 LCP)는 배너 데이터에 gate된 HomeContent 안에 있어 늦게 발견된다. 이미지는 데이터와
// 무관하므로 셸에서 미리 preload해 배너를 기다리는 동안 받아둔다(load delay 제거).
// ReactDOM.preload는 Next 문서가 Client Component 패턴으로 안내하므로 이 컴포넌트로 분리했다
// (client도 초기 SSR돼 <link rel="preload">가 초기 head에 들어간다). 화면엔 아무것도 그리지 않는다.
// getImageProps로 <Image fill sizes>와 같은 srcSet을 만들어 실제 이미지와 같은 URL로 dedup된다.
export function PreloadHero() {
  const { props: hero } = getImageProps({ ...HERO_IMAGE, fill: true });
  preload(hero.src, {
    as: "image",
    imageSrcSet: hero.srcSet,
    imageSizes: hero.sizes,
    fetchPriority: "high",
  });
  return null;
}
