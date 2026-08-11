"use client";

// (commerce) 밖 라우트(/demo·/performance-lab)의 에러를 root layout 안에서 잡는다.
// 커머스 본류는 (commerce)/error.tsx가 Header를 유지한 채 잡고, root layout 자체 에러는
// global-error.tsx가 잡는다. root layout엔 <main>이 없으므로 여기서 <main>으로 감싼다.
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
