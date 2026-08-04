// 원본 starter는 @/types/commerce를 가리켰으나, 그 타입은 week-06 FSD 이관으로
// _pages/home/api로 옮겨졌다. 실재 위치로만 정정한다(banner 계약 파생 의도는 유지).
import type { HomeResponse } from "@/_pages/home/api/queries";

import styles from "./HeroSection.module.css";

type HeroSectionProps = Pick<HomeResponse["banner"], "title" | "description">;

export function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <section className={styles.hero} aria-labelledby="week07-hero-title">
      {/* eslint-disable-next-line @next/next/no-img-element -- Week 7 intentionally starts with an unoptimized LCP image. */}
      <img
        className={styles.image}
        src="/images/week-07/hero-original.jpg"
        alt=""
        width={3840}
        height={2160}
      />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>이번 주의 발견</p>
        <h2 id="week07-hero-title">{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}
