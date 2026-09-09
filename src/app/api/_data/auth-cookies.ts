// 쿠키 이름과 TTL만 담는다. 로직(auth.ts)과 상수를 나눠 둔 것뿐, 런타임 제약 때문이 아니다 —
// proxy는 Node 런타임이라 auth.ts를 그대로 쓴다.

export const SESSION_COOKIE = "session";
export const SCENARIO_COOKIE = "scenario";
export const SESSION_TTL_SECONDS = 60 * 60;
