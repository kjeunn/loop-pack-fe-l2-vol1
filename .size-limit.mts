import { existsSync, readFileSync } from "node:fs";

// 라우트별 First Load JS 예산. Next 16(Turbopack)은 build 출력에 First Load JS를 찍지 않아
// 매니페스트에서 직접 조립한다 — 공통 청크(rootMainFiles) + 그 라우트의 클라이언트 청크.
// size-limit은 파일 경로만 재므로, 해시가 붙은 청크 목록을 빌드 뒤 여기서 읽어 entry로 만든다.
// 그래서 `pnpm build` 뒤에만 의미 있는 결과가 나온다.
//
// 한도는 절대 목표가 아니라 회귀 게이트다 — 7주차 측정에서 LCP를 지배한 건 이미지 전송이지 JS가 아니라,
// "이 바이트 밑이어야 UX가 지켜진다"는 절대선을 세울 근거가 우리 측정엔 없다.
// 한도 = 현재 값(gzip) + 10 kB. 10 kB는 7주차 After(e7d0c2b) → 지금까지 두 주치 정상 성장(라우트당 약 +5 kB)의
// 두 배이고, 무심코 들어오는 라이브러리 하나(TanStack devtools ≈ 40 kB, moment ≈ 70 kB)보다 작다.
// 즉 정상 작업은 통과하고 사고는 걸린다. 수치 근거는 docs/rfc/week10-ci.md 3단계.
// 한도를 올려야 하면 이 파일을 고치는 커밋에 그 이유를 적는다 — CI는 커밋된 숫자와 비교만 한다.

type RouteBudget = { route: string; limit: string };

// 사용자가 처음 내려받는 진입 화면과 구매 경로의 화면만 잰다.
const ROUTE_BUDGETS: RouteBudget[] = [
  { route: "(commerce)/page", limit: "257 kB" },
  { route: "(commerce)/products/page", limit: "260 kB" },
  { route: "(commerce)/cart/page", limit: "246 kB" },
  { route: "(commerce)/order-form/page", limit: "250 kB" },
  { route: "(commerce)/orders/page", limit: "250 kB" },
  { route: "(commerce)/login/page", limit: "247 kB" },
];

// build-manifest의 polyfillFiles는 일부러 뺀다. <script nomodule>로 실리는 core-js 폴리필이라
// ES 모듈을 아는 브라우저는 내려받지 않는다 — 실제 HTML의 script 태그와 대조해 이 청크 하나만 차이 남을 확인했다.
function readSharedChunks(): string[] {
  const manifestPath = ".next/build-manifest.json";
  if (!existsSync(manifestPath)) {
    throw new Error(`${manifestPath}가 없습니다. 먼저 pnpm build를 실행하세요.`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { rootMainFiles: string[] };
  return manifest.rootMainFiles;
}

function readRouteChunks(route: string): string[] {
  const manifestPath = `.next/server/app/${route}_client-reference-manifest.js`;
  if (!existsSync(manifestPath)) {
    throw new Error(`${manifestPath}가 없습니다. 먼저 pnpm build를 실행하세요.`);
  }
  const source = readFileSync(manifestPath, "utf8");
  return [...new Set(source.match(/static\/chunks\/[^"\\]+\.js/g) ?? [])];
}

const sharedChunks = readSharedChunks();

// gzip으로 잰다 — 7주차 이후의 모든 측정(HAR·수동 집계)이 gzip 기준이라 같은 잣대를 유지한다.
export default ROUTE_BUDGETS.map(({ route, limit }) => ({
  name: `${route.replace("(commerce)", "").replace(/\/page$/, "") || "/"} first load`,
  path: [...new Set([...sharedChunks, ...readRouteChunks(route)])].map((chunk) => `.next/${chunk}`),
  limit,
  gzip: true,
}));
