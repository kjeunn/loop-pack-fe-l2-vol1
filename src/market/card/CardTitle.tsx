import { type ReactNode } from "react";

import styles from "./Card.module.css";

interface CardTitleProps {
  children: ReactNode;
  as?: "h2" | "h3" | "h4";
}

// header/body/title을 slot prop(header=, body=)이 아니라 compound로 둔 이유:
// 머리말 구성이 카드마다 다름(제목만 / 제목+버튼 / 제목 없음).
// 호출자가 자유롭게 조합해야 해서 children 기반 compound를 선택.
export function CardTitle({ children, as: Heading = "h2" }: CardTitleProps) {
  return <Heading className={styles.title}>{children}</Heading>;
}
