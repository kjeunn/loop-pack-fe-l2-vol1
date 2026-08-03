// API 오류를 네트워크·HTTP·비즈니스로 구분하는 공통 타입.
// 전역 throwOnError 정책이 이 kind·status로 5xx(경계 전파)와 4xx·네트워크(인라인)를 가른다.
export class ApiError extends Error {
  constructor(
    public readonly kind: "network" | "http" | "business",
    public readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// 5xx·예상 밖 서버 오류만 경계로 전파한다. 4xx·네트워크·비즈니스는 화면 안에서 인라인 처리한다.
export function isServerError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === "http" && (error.status ?? 0) >= 500;
}
