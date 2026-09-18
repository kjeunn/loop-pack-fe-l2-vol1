// 서버가 쓰는 origin은 역할이 둘이고 preview에서는 값이 달라 따로 둔다.
// - 사이트(metadataBase → og:url·canonical): 크롤러에 주는 정식 주소. preview 배포에서도 production 도메인이어야 한다.
//   사람이 선언한 APP_ORIGIN이고, 배포 빌드에서는 env-rules.mts가 VERCEL_PROJECT_PRODUCTION_URL과 대조한다.
// - self-fetch: 지금 이 배포 자신의 주소. preview는 preview 자신을 불러야 production 데이터를 읽고 쓰지 않는다.
//   preview에서만 Vercel이 배포마다 넣어주는 VERCEL_URL(스킴 없는 호스트)을 쓰고, production은 사이트 origin과 같다.
//   production에서도 VERCEL_URL을 쓰지 않는 이유: 그 값은 배포별 생성 URL이라 Vercel Authentication의 기본값
//   (Standard Protection)이 보호하는 대상이고, 공개인 건 production 도메인뿐이다. 생성 URL로 self-fetch하면
//   보호가 켜진 순간 로그인 페이지를 받는다.
//
// 둘 다 함수다. 모듈 최상위에서 읽으면 이 모듈을 import한 브라우저 번들에서도 평가되는데,
// 서버 전용 env는 브라우저에 없어 throw하고 클라이언트 트리가 통째로 에러 경계로 간다.
// 브라우저는 상대경로로 fetch하고 metadata는 서버만 만들므로, 서버 분기 안에서만 부르면 브라우저는 이 값을 볼 일이 없다.
// 기본값(localhost)을 두지 않는다. 미설정 시 조용히 폴백하면 잘못된 self-fetch·OG URL이 에러 없이 나가 오설정이 숨는다.
export function getSiteOrigin(): string {
  const appOrigin = process.env.APP_ORIGIN;
  if (!appOrigin) {
    throw new Error(
      "APP_ORIGIN이 설정되지 않았습니다. 서버 self-fetch·metadataBase가 쓰는 origin이므로 build·runtime에 반드시 설정하세요.",
    );
  }
  return appOrigin;
}

export function getServerFetchOrigin(): string {
  const previewHost = process.env.VERCEL_ENV === "preview" ? process.env.VERCEL_URL : undefined;
  // Vercel 시스템 변수는 스킴 없이 호스트만 주고, Vercel은 https만 서빙한다.
  return previewHost ? `https://${previewHost}` : getSiteOrigin();
}
