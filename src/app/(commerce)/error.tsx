"use client";

// 이 route 세그먼트에서 던져진 에러를 잡는 공용 error boundary(App Router).
// reset()으로 해당 세그먼트를 재렌더해 재시도한다.
interface AppErrorProps {
  error: Error;
  reset: () => void;
}

export default function AppError({ reset }: AppErrorProps) {
  return (
    <main className="mx-auto max-w-[560px] px-6 py-16 text-center">
      <p className="mb-4 text-gray-700">문제가 발생했어요. 잠시 후 다시 시도해 주세요.</p>
      <button
        type="button"
        onClick={reset}
        className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
      >
        다시 시도
      </button>
    </main>
  );
}
