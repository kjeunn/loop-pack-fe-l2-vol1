"use client";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  fallback: (props: { error: Error; reset: () => void }) => ReactNode;
  // 경계를 초기화할 때 함께 호출한다. QueryErrorResetBoundary의 reset을 연결해
  // 쿼리 에러 상태까지 지워 다음 렌더에서 다시 조회하게 한다.
  onReset?: () => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// 도메인 무지 렌더 에러 경계. 던져진 에러를 잡아 fallback을 그리고 reset으로 다시 시도한다.
// throwOnError로 전파된 5xx를 화면 일부(결과 영역)만 감싸 헤더·필터는 살린 채 복구한다.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  private reset = () => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return this.props.fallback({ error: this.state.error, reset: this.reset });
    }
    return this.props.children;
  }
}
