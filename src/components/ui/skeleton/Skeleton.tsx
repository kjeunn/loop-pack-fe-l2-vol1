import styles from "./Skeleton.module.css";

// 범용 로딩 스켈레톤. 크기·모양은 className(Tailwind)으로, shimmer는 모듈이 담당한다.
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={`${styles.skeleton} ${className ?? ""}`} />;
}
