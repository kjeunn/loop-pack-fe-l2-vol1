// 서버가 쓰는 origin은 역할이 둘인데(self-fetch, metadataBase→og:url·canonical) 이 배포에서는 값이 같다.
// 둘 다 공개 주소인 production 도메인이어야 하기 때문이다.
//
// self-fetch에 배포별 생성 URL(VERCEL_URL)을 쓰지 않는 이유: 이 프로젝트의 Deployment Protection이
// Standard Protection이라 production 도메인만 공개고 생성 URL과 모든 preview는 인증 벽 뒤에 있다.
// Vercel 문서도 Standard Protection으로 옮길 때 "VERCEL_URL을 쓰는 fetch를 사용자가 요청한 도메인으로 바꾸라"고
// 안내한다(deployment-protection#how-to-migrate-to-standard-protection). 생성 URL로 self-fetch하면 로그인 페이지를 받는다.
// preview에 env를 주기 시작하면 self-fetch는 들어온 요청의 origin과 쿠키를 넘기는 방식이어야 하고, 그건 이 함수가 아니라
// 요청 컨텍스트를 아는 곳의 일이다. 지금은 preview 빌드가 env 없이 막히므로 그 경로가 존재하지 않는다(RFC 3.6).
//
// 함수인 이유: 모듈 최상위에서 읽으면 이 모듈을 import한 브라우저 번들에서도 평가되는데,
// 서버 전용 env는 브라우저에 없어 throw하고 클라이언트 트리가 통째로 에러 경계로 간다.
// 브라우저는 상대경로로 fetch하고 metadata는 서버만 만들므로, 서버 분기 안에서만 부르면 브라우저는 이 값을 볼 일이 없다.
// 기본값(localhost)을 두지 않는다. 미설정 시 조용히 폴백하면 잘못된 self-fetch·OG URL이 에러 없이 나가 오설정이 숨는다.
export function getAppOrigin(): string {
  const appOrigin = process.env.APP_ORIGIN;
  if (!appOrigin) {
    throw new Error(
      "APP_ORIGIN이 설정되지 않았습니다. 서버 self-fetch·metadataBase가 쓰는 origin이므로 build·runtime에 반드시 설정하세요.",
    );
  }
  return appOrigin;
}
