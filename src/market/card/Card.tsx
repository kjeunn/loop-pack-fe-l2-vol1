import { type ReactNode } from "react";

import styles from "./Card.module.css";

interface CardProps {
  children: ReactNode;
}

// 카드를 region 랜드마크로 만들지 않는 이유:
// 카드마다 랜드마크를 켜면 화면 하나에 랜드마크가 8개로 늘어 오히려 탐색 노이즈가 된다.
// 문서 구조는 Card.Title의 heading(<h2>)이 제공하므로 section은 이름 없이 둔다.
export function Card({ children }: CardProps) {
  return <section className={styles.card}>{children}</section>;
}
