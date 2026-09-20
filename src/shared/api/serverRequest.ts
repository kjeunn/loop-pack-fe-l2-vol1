// 서버 self-fetch가 쓸 "들어온 요청"의 맥락. 값이 아니라 요청에서 읽는다.
//
// 왜 APP_ORIGIN이 아니라 요청 origin인가: 배포는 여러 주소로 서빙된다(production 도메인, preview 주소).
// 사람이 넣는 값 하나로 고정하면 preview가 production을 부르거나 그 반대가 된다.
// 요청 origin을 쓰면 "지금 이 요청이 온 주소"를 그대로 부르므로 환경마다 맞춘 설정이 필요 없다.
// Vercel도 Standard Protection 안내에서 self-fetch를 "사용자가 요청한 도메인"으로 바꾸라고 한다.
//
// 쿠키를 같이 넘기는 이유: Deployment Protection이 켜진 preview는 공개 경로까지 인증 벽 뒤에 있다.
// 들어온 요청은 이미 그 벽을 통과한 쿠키를 갖고 있으므로 그대로 넘겨야 self-fetch도 통과한다.
// same-origin 요청이라 브라우저가 보냈을 것과 같은 범위이고, 지금 self-fetch가 타는 /api/home·/api/products는
// 쿠키를 읽지 않으므로 이 전달이 현재 동작을 바꾸지는 않는다.
// `server-only`를 붙이지 않는다. 이 모듈은 fetcher가 부르는데 fetcher는 클라이언트 컴포넌트도 쓰므로
// 클라이언트 SSR 그래프에 들어가 빌드가 막힌다(실제로 막혔다). 대신 호출자가 `typeof window`로 막고,
// 브라우저에 실리지 않는 것은 빌드 산출물로 확인한다(.next/static에 next/headers·x-forwarded-proto 0건).
export type ServerRequestContext = { origin: string; cookie: string | null };

export async function readServerRequestContext(): Promise<ServerRequestContext | null> {
  let requestHeaders: Headers;
  try {
    const { headers } = await import("next/headers");
    requestHeaders = await headers();
  } catch {
    // 요청 스코프 밖(vitest·스크립트)이다. 호출자가 APP_ORIGIN으로 돌아간다.
    // 정적 생성 중에도 headers()는 던지는데, self-fetch가 타는 라우트는 fetch가 no-store라
    // 이미 동적이라서 여기로 오지 않는다(빌드 출력의 ƒ로 확인).
    return null;
  }

  const host = requestHeaders.get("host");
  if (!host) {
    return null;
  }
  // Vercel은 x-forwarded-proto를 채운다. 로컬 dev·start에는 없어 http로 본다.
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return { origin: `${protocol}://${host}`, cookie: requestHeaders.get("cookie") };
}
