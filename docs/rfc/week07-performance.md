# 7주차 성능 최적화 — 측정 기록

과제가 요구하는 산출물만 단계별로 채운다. 실측은 production build(`pnpm build && pnpm start`)에서, 확장·캐시·로그인 없는 별도 브라우저 프로필로 한다.

## 0단계 — Before

### SHA와 재현 조건

SHA를 제외한 아래 조건은 Before·After에서 동일하게 둔다.

- **Before SHA**: (기록)
- **After SHA**: (4단계에서 기록)
- **URL·행동**: 홈 `/` cold load
- **viewport / CPU throttling / network throttling**: (측정 시 기록)
- **브라우저·Lighthouse 버전**: (측정 시 기록)

Before 구성: 최적화하지 않은 7.5MB 원본(`hero-original.jpg`)을 `HeroSection`으로 홈 LCP에 연결하고, `/api/products?scenario=slow`를 열어 목록 지연을 측정 가능하게 했다.

### 5회 raw 값

| 지표 | 1   | 2   | 3   | 4   | 5   | median | min | max |
| ---- | --- | --- | --- | --- | --- | ------ | --- | --- |
| FCP  |     |     |     |     |     |        |     |     |
| LCP  |     |     |     |     |     |        |     |     |
| CLS  |     |     |     |     |     |        |     |     |

### 관찰

- **LCP element**: (기록)
- **filmstrip 표시 순서** (Header · 페이지 제목 · Hero): (기록)
- **Network waterfall** (document · 홈 데이터 · Hero 이미지 요청 시작 순서와 전송 크기): (기록)
- **목록 slow 녹화**: 데이터 없는 최초 진입 / 기존 목록 갱신 / 취소된 요청 — (각각 기록)

### 가설

- **관찰한 사실**: (한 문장)
- **원인 가설**: (한 문장)
- **반증 방법**: (한 문장)
- **가장 작은 변경**: (한 문장)
