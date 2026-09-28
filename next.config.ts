import type { NextConfig } from "next";

import { validateEnv } from "./scripts/env-rules.mts";

// 빌드가 env를 쓰기 전에 거른다. Next가 .env*를 읽은 뒤 이 파일을 평가하므로 로컬·배포 빌드 모두 같은 검사를 받는다.
// `next start`도 이 파일을 다시 평가해 서버 시작에서 같은 검사가 돈다 — 그래서 시작 시점 검사를 따로 두지 않았다.
// 이건 Next 16.2.10에서 관측한 동작이지 문서로 보장된 계약이 아니다. 업그레이드 때 다시 확인한다.
// CI는 같은 스크립트를 빌드 앞 step으로도 불러 실패를 step 이름으로 드러낸다.
const envProblems = validateEnv(process.env);
if (envProblems.length > 0) {
  const lines = envProblems.map(({ name, problem }) => `- ${name}: ${problem}`).join("\n");
  throw new Error(`환경 변수 검증 실패\n${lines}`);
}

const nextConfig: NextConfig = {};

export default nextConfig;
