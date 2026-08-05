# 7주차 성능 최적화 — 측정 기록

과제가 요구하는 산출물만 단계별로 채운다. 실측은 production build(`pnpm build && pnpm start`)에서, 확장·캐시·로그인 없는 별도 브라우저 프로필로 한다.

## 0단계 — Before

### SHA와 재현 조건

SHA를 제외한 아래 조건은 Before·After에서 동일하게 둔다.

- **Before SHA**: `213d205`
- **After SHA**: (4단계에서 기록)
- **URL·행동**: 홈 `/` cold load
- **측정 방식 (Before·After 공통)**: Lighthouse Navigation · Device Desktop(viewport 1350×940) · Categories Performance만 · **Simulated throttling**(RTT 40ms · 10.24Mbps · CPU 1x).
- **Simulated를 쓰는 이유**: Before↔After를 같은 잣대로 비교하려면 run 간 편차가 작아야 한다. Simulated는 빠르게 한 번 잰 뒤 목표 조건을 계산해 편차가 작아 5회 median이 안정적이다. 실제로 느리게 받는 DevTools throttling은 체감엔 정확하나 편차가 커 비교엔 불리하므로, 실제 전송 지연은 아래 실측 waterfall로 따로 관찰한다.
- **브라우저·Lighthouse 버전**: 표의 5회는 실브라우저 Chrome / DevTools Lighthouse 13.3.0. 헤드리스 CLI(Lighthouse 13.4.1)로도 교차 확인했고 방향은 같다(LCP median 6.71s — 헤드리스가 절대값은 더 빠름).

Before 구성: 최적화하지 않은 7.5MB 원본(`hero-original.jpg`)을 `HeroSection`으로 홈 LCP에 연결했다. 목록 지연은 `productListQueryOptions`가 빌드 env `NEXT_PUBLIC_MOCK_SCENARIO`를 읽어 서버 prefetch·클라 요청 모두에 `scenario=slow`를 싣는 방식으로 재현한다(사용자 URL 상태와 분리해 metadata·공유 URL엔 안 샘). 측정은 `pnpm build:slow && pnpm start:slow`로 실행하며, env는 build 인라인·start 런타임 양쪽에 필요하다(둘이 다르면 서버·클라 query key가 어긋난다).

### 5회 raw 값

| 지표    | 1     | 2     | 3     | 4     | 5     | median | min   | max   |
| ------- | ----- | ----- | ----- | ----- | ----- | ------ | ----- | ----- |
| FCP (s) | 0.58  | 0.58  | 0.57  | 0.93  | 0.58  | 0.58   | 0.57  | 0.93  |
| LCP (s) | 8.10  | 8.10  | 8.09  | 8.79  | 8.10  | 8.10   | 8.09  | 8.79  |
| CLS     | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 0.000 | 0.000 |

### 관찰

출처 표기 — `[실측]` 실브라우저 DevTools(Network 탭 HAR · Performance 탭 trace · Lighthouse 13.3.0), `[HTML]` 서버 첫 응답 마크업.

관찰 조건(Network·Performance 탭) — Disable cache · CPU No throttling · Screenshots 켜고, **네트워크는 Fast 4G(≈10Mbps)로 throttle**한다. localhost는 대역폭이 무제한이라 throttle을 끄면 7.2MB Hero도 즉시 로드돼 병목이 사라지므로, 실제 사용자 전송을 재현하려면 반드시 조여야 한다. Fast 4G는 desktop 기준(10Mbps)에 가장 가까운 프리셋이라 실측 Hero ≈8s와 정합한다. 이 탭들은 simulate가 아닌 applied throttling이라 값이 위 표(simulate)가 아니라 실측에 대응한다.

- **LCP element** `[실측]`: performance trace 기준 LCP 후보가 둘이다. FCP(1.02s)에 제목 `H2#week07-hero-title`(32,678px²)이 첫 후보였다가, 더 큰 Hero `img.HeroSection-module__image`(508,725px², `hero-original.jpg`)가 8.9s에 최종 LCP로 교체된다. 즉 텍스트가 먼저 최대 요소였지만 Hero가 뒤늦게 그것을 밀어내며 LCP를 8.9s로 끌어올린다.
- **filmstrip 표시 순서** (Header · 페이지 제목 · Hero) `[실측]`: 필름스트립 65컷(0~9.1s). FCP 1.02s에 Header·제목이 그려지고 Hero 자리는 계속 비어 있다가, 다운로드가 끝나는 8.9s에야 Hero가 채워진다 — 이 8초 공백이 LCP 지연의 원인이다.
- **Network waterfall** (document · 홈 데이터 · Hero 이미지 요청 시작 순서와 전송 크기) `[실측]`: document `/`(7.4KB, 623ms) 직후 +642ms에 `hero-original.jpg`(7,368.7KB)가 시작해 로드에 8.16s 소요(675ms→8830ms) — CSS·JS·상품 이미지(webp 3~70KB)는 같은 구간에서 1s 내 병렬 완료. Hero 발견은 672ms로 이르다(상품 이미지 +0.94s·데이터 `_rsc` +1.53s보다 앞서 Hero가 먼저 발견됨). `[HTML]` 확인: Hero는 `<link rel="preload" as="image">`로 예약되고 `width/height`가 명시되며 `loadingAttr`이 비어 lazy가 아니다 — 발견·치수는 최적, 병목은 페이로드 크기뿐. Lighthouse "Improve image delivery" 절감 추정 7,099 KiB `[실측]`.
- **목록 slow 녹화** `[실측]` (Network Preserve log HAR + Performance trace, `scenario=slow` 배선 경유):
  - **데이터 없는 최초 진입**: 하드 로드 시 SSR이 항상 prefetch하므로 클라 스켈레톤 없이 **서버에서 1.5s 블록** 후 목록이 한 번에 뜬다(현재 미개선 동작).
  - **기존 목록 갱신**: 목록이 있는 상태에서 카테고리 변경 시 `keepPreviousData`로 이전 목록을 유지한 채 1.5s 재요청한다(즉시 비우지 않음).
  - **취소된 요청**: 카테고리를 1.5s 내 연속 변경(fashion +4079~5591ms · goods +5459~6971ms)하면 두 요청이 겹친다. 먼저 끝난 fashion 응답(5591ms)은 활성 key가 goods라 화면에 반영되지 않아, 늦은 이전 요청이 현재 화면을 덮지 않는다. (AbortSignal 미사용이라 네트워크 취소가 아니라 TanStack이 비활성 key 결과를 무시하는 방식.)
  - **URL 복원(뒤로가기)** `[실측]`: 카테고리 변경은 `history: "push"`로 쌓여, 취소 시퀀스(…→fashion→goods) 뒤 뒤로가기를 누르면 URL이 직전 `category=fashion`으로 복원되고 화면도 fashion으로 돌아온다(URL↔화면 일치). 취소된 fashion 요청은 화면 반영만 막혔을 뿐 완료돼 캐시에 남아, 이 복원이 재요청 없이 즉시 이뤄진다.
  - **전환 시 CLS** `[실측]`: 느린 목록이 최종 렌더될 때 Layout Shift score **0.164**(입력 근접 제외) 관찰 — 카테고리별 상품 수·높이 차로 콘텐츠가 밀린다. 홈 CLS 0과 대비되며, fallback 공간 예약은 2단계에서 다룬다.

### 가설

- **관찰한 사실**: 최종 LCP element가 3840×2160 원본 Hero(전송 7,368.7KB)이고, 제목이 먼저 그려진 뒤(FCP 1.02s) LCP까지의 격차 전부가 이 이미지의 로드 시간(실측 8.16s)이다.
- **원인 가설**: Hero는 preload·치수 명시로 발견은 최적이나, 원본 크기 그대로 내려받아 대역폭을 수 초 점유해 LCP를 지배한다.
- **반증 방법**: Hero만 렌더 치수로 리사이즈+최신 포맷으로 교체했을 때 LCP만 떨어지고 FCP·CLS가 불변인지 확인한다 — 불변이 아니면 크기 외 다른 원인이다.
- **가장 작은 변경**: Hero 이미지를 렌더 치수에 맞춰 리사이즈하고 webp/avif로 변환(발견·preload·치수는 이미 최적이라 손대지 않음).

## 1단계 — Hero LCP

### After SHA와 조건

- **After SHA (1단계)**: `ff85cab`
- 조건은 0단계와 동일(Device Desktop · Performance만 · Simulated). Hero를 `next/image`로 바꿔 원본을 소스로 두고 표시폭(<=1200px) 후보·webp로 리사이즈한다.

### LCP 구간 분해 (Before) `[실측]`

LCP를 네 구간으로 나누면 전송이 지배한다. 발견·치수·preload는 이미 최적이라 남는 병목은 크기뿐.

| 구간                | Before      | 판단                       |
| ------------------- | ----------- | -------------------------- |
| 서버 응답(document) | 623ms       | 짧음                       |
| 이미지 발견         | 672ms       | 이르다(문서 직후, preload) |
| **이미지 전송**     | **8,155ms** | **지배 구간**              |
| 렌더(전송→paint)    | ~78ms       | 짧음                       |

### 선택·제외한 변경

Before 사실로 걸러 채택한 변경은 하나뿐이다.

- **채택 — 표시폭 리사이즈 + webp + viewport 후보(srcset/sizes)**: 3840×2160·7,368.7KB가 표시폭(<=1200px)보다 과대해 전송이 8.16s를 차지. `next/image fill`+`sizes`로 표시폭 후보를 받게 한다. `fill`은 img의 명시 `width/height`(3840×2160) 대신 `.hero`의 기존 `aspect-ratio`로 공간을 잡으므로, 공간 예약 방식은 그대로여서 CLS가 유지된다.
- **제외 — 요청 순서 분리**: 상품 이미지(webp 3~70KB, 총 ~200KB)는 Hero보다 늦게 시작해 ~1s 내 끝나고 대역 경합이 ≈2%라 Hero를 막지 않는다.
- **제외 — lazy loading**: Hero는 above-fold LCP 요소라 지연하면 LCP가 악화된다(상품 이미지만 lazy).
- **제외 — 우선순위 상향**: 발견이 672ms로 이미 이르다. `next/image`가 무지정 시 lazy로 내리므로 `priority`로 기존 preload·eager를 **유지**만 하고 더 높이지 않는다.

### Before ↔ After 비교 `[실측]`

After 5회 raw (실브라우저 Chrome / DevTools Lighthouse 13.3.0):

| 지표    | 1    | 2    | 3    | 4    | 5    | median | min  | max  |
| ------- | ---- | ---- | ---- | ---- | ---- | ------ | ---- | ---- |
| FCP (s) | 0.58 | 0.58 | 0.58 | 0.58 | 0.58 | 0.58   | 0.58 | 0.58 |
| LCP (s) | 1.18 | 1.18 | 1.18 | 1.18 | 1.18 | 1.18   | 1.18 | 1.18 |
| CLS     | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.000  | 0.00 | 0.00 |

| 증거        | Before                               | After                    | 변화                              |
| ----------- | ------------------------------------ | ------------------------ | --------------------------------- |
| LCP median  | 8.10s                                | 1.18s                    | −85% (poor→good)                  |
| Hero 전송   | 7,368.7KB                            | 170.7KB (w=2048, retina) | −97.7%                            |
| 전송 구간   | 8,155ms                              | 510ms                    | 병목 해소                         |
| 발견        | 672ms                                | 531ms                    | preload 유지                      |
| FCP median  | 0.58s                                | 0.58s                    | 불변                              |
| CLS         | 0.000                                | 0.0001                   | 불변                              |
| SI          | 2.65s                                | 0.96s                    | −64%                              |
| LCP element | Hero `img.HeroSection-module__image` | 동일                     | 시각 요소 그대로, 바이트만 최적화 |

가설이 예측한 대로 LCP만 급감하고 FCP·CLS는 불변 → 크기 외 다른 원인이 아니었음이 반증을 통과한다.

### filmstrip 관찰 `[실측]`

Before·After 모두 제목(텍스트) 먼저 → Hero 이미지 나중 순서는 동일하다. 다만 제목→이미지 격차(LCP−FCP)가 7.52s에서 0.60s로 줄어든다. 순서가 그대로인 것은 이미지 크기만 바꾼 격리된 변경임을 확인해 준다(렌더 경계는 손대지 않음).

### 검증

- 육안 품질: 원본 대비 열화 없음(작성자 확인).
- 회귀: 테스트 88개·lint·typecheck·build 통과. LCP element·비율·문구 유지, CLS 무이동.
