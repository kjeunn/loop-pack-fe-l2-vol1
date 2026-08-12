// 서버가 자기 API를 부를 때의 base와 metadataBase(OG 절대 URL)가 같은 origin을 쓰도록 한 곳에 둔다.
// 기본값을 두지 않는다: 미설정 시 조용히 localhost로 폴백하면 배포에서 잘못된 self-fetch·OG URL이
// 에러 없이 나가 오설정이 숨는다. 없으면 즉시 던져 build·runtime에서 바로 드러낸다.
// 비배포 환경은 각자 명시한다 — 로컬 .env.local · CI 워크플로 env · 테스트 vitest env.
const origin = process.env.APP_ORIGIN ?? process.env.NEXT_PUBLIC_BASE_URL;

if (!origin) {
  throw new Error(
    "APP_ORIGIN이 설정되지 않았습니다. 서버 self-fetch·metadataBase가 쓰는 origin이므로 build·runtime에 반드시 설정하세요.",
  );
}

export const APP_ORIGIN = origin;
