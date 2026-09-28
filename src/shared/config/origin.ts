// 사이트의 정식 origin. metadataBase가 여기서 og:url·canonical을 만든다.
// 크롤러에 주는 주소라 배포 환경과 무관하게 production 도메인이어야 하고, env 규칙 ⑥이 배포 빌드에서 그걸 대조한다.
//
// 서버 self-fetch는 이 값을 쓰지 않는다. 배포는 production 도메인과 preview 주소로 동시에 서빙되므로
// 값 하나로 고정하면 한쪽이 틀린다. self-fetch는 들어온 요청의 origin을 쓴다(serverRequest.ts).
// 요청 스코프가 없는 자리(스크립트 등)에서만 이 값이 fetch의 fallback으로 쓰인다.
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
