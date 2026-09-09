// RFC §B(week09-e2e-scope.md)의 시드 로그 집계를 재현한다. 문서의 수치는 전부 이 스크립트 출력이다.
// 레포 도구가 아니라 이 RFC의 근거라 문서 옆에 둔다(Advanced B 생성물 보존과 같은 결).
// 실행: node docs/rfc/week09-seed-analysis.mjs
//
// 정의(§B "집계 방법"·"노이즈 기준"과 같다):
// - 중복: sessionId·name·props·ts가 완전히 같은 재전송. 복사본만 빼고 세션은 남긴다.
// - 봇: device가 null인 세션. 세션을 통째로 분모에서 뺀다.
// - client_error: 우리 앱에 없는 화면의 오류라 경로 집계 대상이 아니다.
// - 경로는 화면 묶음. 목록(진입·필터·정렬·페이지) / 담기 / 로그인(login_start) / 찜 / 주문 시작 / 주문 완료.
// - 비율 분모는 노이즈를 뺀 전체 세션. 이탈률은 "다음 단계 미진입"(그 세션에 다음 단계 이벤트가 없음).
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const SEED = fileURLToPath(new URL("../../fixtures/events-30d.jsonl", import.meta.url));

// 화면 묶음 → 이벤트 이름. 순서는 표 순서.
const PATHS = [
  ["목록", ["product_list_view", "category_filter_change", "sort_change", "page_change"]],
  ["담기", ["cart_add"]],
  ["로그인", ["login_start"]],
  ["찜", ["wishlist_add"]],
  ["주문 시작", ["order_start"]],
  ["주문 완료", ["order_complete"]],
];
// 이탈률의 "다음 단계". 찜(퍼널 밖)·주문 완료(종료)는 없다.
const NEXT_STAGE = {
  목록: ["cart_add"],
  담기: ["order_start"],
  로그인: ["login_success"],
  "주문 시작": ["order_complete"],
};

async function readEvents() {
  const events = [];
  const lines = createInterface({ input: createReadStream(SEED) });
  for await (const line of lines) {
    if (line.trim()) {
      events.push(JSON.parse(line));
    }
  }
  return events;
}

const pct = (n, d) => `${((n / d) * 100).toFixed(1)}%`;
const fmt = (n) => n.toLocaleString("en-US");

function groupBySession(events) {
  const sessions = new Map();
  for (const event of events) {
    if (!sessions.has(event.sessionId)) {
      sessions.set(event.sessionId, []);
    }
    sessions.get(event.sessionId).push(event);
  }
  return sessions;
}

function sessionsReaching(sessions, names) {
  const set = new Set(names);
  let count = 0;
  for (const events of sessions.values()) {
    if (events.some((event) => set.has(event.name))) {
      count += 1;
    }
  }
  return count;
}

function pathTable(sessions) {
  const total = sessions.size;
  const rows = [];
  for (const [path, names] of PATHS) {
    const reached = [...sessions.values()].filter((events) =>
      events.some((event) => names.includes(event.name)),
    );
    const next = NEXT_STAGE[path];
    let dropout = "N/A";
    if (next) {
      const missing = reached.filter(
        (events) => !events.some((event) => next.includes(event.name)),
      ).length;
      dropout = pct(missing, reached.length);
    }
    // "세션 마지막" 정의(§B가 채택하지 않은 정의)도 대조용으로 같이 낸다.
    const lastEvent = reached.filter((events) => names.includes(events.at(-1).name)).length;
    rows.push({
      경로: path,
      세션수: fmt(reached.length),
      비율: pct(reached.length, total),
      "이탈률(다음 단계 미진입)": dropout,
      "세션 마지막 비율": pct(lastEvent, reached.length),
    });
  }
  return rows;
}

const raw = await readEvents();
const rawSessions = groupBySession(raw);
console.log(`원본: ${fmt(rawSessions.size)}세션 · ${fmt(raw.length)}이벤트\n`);

// 1) 중복 — 복사본만 제거
const seen = new Set();
const dedupOnly = [];
let duplicates = 0;
for (const event of raw) {
  const key = `${event.sessionId}|${event.name}|${JSON.stringify(event.props)}|${event.ts}`;
  if (seen.has(key)) {
    duplicates += 1;
    continue;
  }
  seen.add(key);
  dedupOnly.push(event);
}

// 2) 봇 — device null 세션 통째 제거 (+ 판정 근거 검산)
const botSessions = new Set(
  dedupOnly.filter((event) => event.device === null).map((e) => e.sessionId),
);
const botEvents = dedupOnly.filter((event) => botSessions.has(event.sessionId));
const botAllSingleListView = [...groupBySession(botEvents).values()].every(
  (events) => events.length === 1 && events[0].name === "product_list_view",
);
const botHoursUtc = new Set(botEvents.map((event) => new Date(event.ts).getUTCHours()));

// 3) client_error — 경로 집계 대상 아님 (+ 판정 근거 검산)
const clientErrors = dedupOnly.filter((event) => event.name === "client_error");
const allImageLoadFailed = clientErrors.every((event) => event.props?.code === "IMAGE_LOAD_FAILED");
const prevWasDetail = clientErrors.every((event) => {
  const events = rawSessions.get(event.sessionId);
  const index = events.findIndex(
    (e) => e === event || (e.ts === event.ts && e.name === event.name),
  );
  return events[index - 1]?.name === "product_detail_view";
});

const filtered = dedupOnly.filter(
  (event) => !botSessions.has(event.sessionId) && event.name !== "client_error",
);
const filteredSessions = groupBySession(filtered);
const maxEventsPerSession = Math.max(...[...filteredSessions.values()].map((e) => e.length));

console.log("노이즈:");
console.log(
  `- 중복 ${fmt(duplicates)}줄 (${((duplicates / raw.length) * 100).toFixed(2)}%) — 복사본만 제외, 세션 유지`,
);
console.log(
  `- 봇 ${fmt(botSessions.size)}세션 (${pct(botSessions.size, rawSessions.size)}) — device null. 전량 단발 product_list_view: ${botAllSingleListView}, 발생 시각(UTC 시): ${[...botHoursUtc].join(",")}`,
);
console.log(
  `- client_error ${fmt(clientErrors.length)}건 — 전량 IMAGE_LOAD_FAILED: ${allImageLoadFailed}, 직전 이벤트 전량 product_detail_view: ${prevWasDetail}`,
);
console.log(`- 세션당 최대 이벤트: ${maxEventsPerSession}\n`);

console.log(`거른 뒤: ${fmt(filteredSessions.size)}세션 · ${fmt(filtered.length)}이벤트\n`);

console.log("거르기 전후 도달 세션(분모: 전=원본 세션, 후=거른 세션):");
console.table(
  PATHS.map(([path, names]) => ({
    경로: path,
    "Before 세션": fmt(sessionsReaching(rawSessions, names)),
    "Before 비율": pct(sessionsReaching(rawSessions, names), rawSessions.size),
    "After 세션": fmt(sessionsReaching(filteredSessions, names)),
    "After 비율": pct(sessionsReaching(filteredSessions, names), filteredSessions.size),
  })),
);

console.log("경로 분석표(거른 뒤):");
console.table(pathTable(filteredSessions));
