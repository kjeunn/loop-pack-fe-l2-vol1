# Loopers Frontend 스터디
 
> **"설명할 수 없는 코드는 커밋하지 않는다."** — 이 스터디의 제1원칙이자, 이 레포의 모든 커밋에 적용한 기준입니다.
 
Loopers 프론트엔드 과정(TypeScript · React · Next.js)의 과제를 수행하며 남긴 기록입니다.
단순 기능 구현이 아니라 **코드 품질 · 설계 근거 · AI 협업 방식**에 집중합니다.
매주 과제를 수행해 PR로 제출하고, 코치 리뷰 피드백을 반영해 수정·보완하는 방식으로 진행합니다.
 
- **기간**: 2026.06 — 진행 중
- **스택**: TypeScript · React 19 · Next.js (App Router) · TanStack Query · nuqs · Zustand · Tailwind CSS v4 · Vitest · Playwright
- **이 브랜치(`kjeunn`)**: 주차별 작업을 통합한 브랜치 (main은 upstream 동기화 전용)
## 브랜치 구조
 
| 브랜치 | 용도 |
| --- | --- |
| `kjeunn` | **작업 총집합** — 주차별 결과물이 모두 병합된 브랜치 (기본 브랜치) |
| `feat/week-0N` | 주차별 작업 브랜치 — 각 주차의 커밋 히스토리와 근거 문서 |
| `main` | upstream(스터디 원본) 동기화 전용 |
 
> 이 레포는 스터디 원본을 포크한 것입니다. 커리큘럼·과제 운영·제출 절차는 **[스터디 원본 레포](https://github.com/loopers-labs/loop-pack-fe-l2-vol1)** 의 README를 참고하세요.
 
## 주차별 기록
 
### [1주차 — 코드 품질 하네스 & AI 협업 환경](../../tree/feat/week-01)
 
기능 구현 전에 "좋은 코드의 기준"을 기계에 새기는 작업부터 시작했습니다.
 
- ESLint(flat config) + Prettier + husky·lint-staged로 **커밋 게이트** 구성 — 핵심 룰은 `error` 레벨로 우회 불가능하게
- 고의로 규칙을 위반한 커밋을 시도해 **게이트가 실제로 막히는지 검증** ([커밋 기록](../../commits/feat/week-01))
- AI 협업 규칙을 `CLAUDE.md`에 정리 — AI가 생성한 코드에도 같은 게이트가 적용되도록
### [2주차 — 컴포넌트 & Props 리팩토링](../../tree/feat/week-02)
 
동작하는 체크아웃 화면에서 bad smell을 판별하고, **근거 있는 리팩토링만** 수행했습니다.
 
- 파생 상태를 state로 들고 있던 `finalPrice`를 **렌더 시 계산으로 전환** — 상태 동기화 버그(VIP 할인 미반영) 함께 수정
- God Component에서 `PriceSummaryCard` · `OrderCompletePage` 분리, 카드 전용 스타일 CSS Modules 전환
- 절대경로 alias(`@/*`) 도입, 컴포넌트 작업 컨벤션을 `CONVENTION.md`로 문서화
### [3주차 — 관심사 분리 & Custom Hook](../../tree/feat/week-03)
 
500줄 단일 컴포넌트(`ProductListPage`)를 **Components / Hooks / Services / Utils** 레이어로 분리했습니다.
분리한 것과 **분리하지 않은 것 모두** 근거를 남겼습니다. → [관심사 판별표 · 버그 기록](../../blob/feat/week-03/src/productList/README.md)
 
- 상태 3분할(서버 / 클라이언트 / 파생값) 기준으로 Custom Hook 추출 — `useProducts` · `useProductQuery` · `useWishlist` 등
- 필터·검색·페이지 조건의 **단일 소스를 URL로 전환** — 새로고침·공유·뒤로가기에서 조건 복원
- 빠른 필터 변경 시 옛 응답이 최신 응답을 덮어쓰는 **race condition 방어**, 범위 초과 페이지 URL 진입 가드
- 로딩·에러 boolean 조합을 status enum으로 통합
### [4주차 — Next.js 착수 & 디자인 패턴](../../tree/feat/week-04)
 
Next.js(App Router)로 커머스 베이스를 세우고, UI 라이브러리 없이 패턴을 직접 구현했습니다.
 
- **Select (Headless)** — 로직 한 벌(`useSelect`: 키보드 내비게이션·품절 옵션 스킵·객체 value)로 텍스트/사이즈/썸네일 3종 UI 렌더
- **Dialog (Compound)** — `Dialog.Trigger/Overlay/Panel/Title/Description/Close` 조립, controlled·uncontrolled **이중 API**, Portal 렌더, 중첩 다이얼로그의 전역 자원 처리(스크롤 잠금 refcount · Esc stack), SSR mounted 가드
- Vitest + Playwright를 직접 셋업하고 Select·Dialog의 **컴포넌트 계약 테스트** 작성
- FSD 관점의 레이어 정리(shared / features / views) 및 Tailwind v4 도입
### [5주차 — 상태 관리 아키텍처](../../tree/feat/week-05)

도구를 먼저 고르지 않고 **Source of Truth를 먼저 찾는** 기준으로 상태 경계를 설계했습니다. 홈·상품 목록을 만들며 값마다 원본의 위치로 저장소를 나눴습니다.

- **상태 경계** — 서버 데이터는 TanStack Query(`queryOptions` 팩토리), 공유·복원이 필요한 검색 조건은 nuqs(URL 상태), 익명 장바구니·위시리스트는 Zustand(persist·id만 저장, 개수는 `ids.length`로 파생), 입력 초안은 React 로컬 상태
- **Advanced A~D** — persist 영속화(`skipHydration` · zod · `version`/`migrate`) · 홈 서버 프리패치(요청별 QueryClient · `dehydrate`/`HydrationBoundary`) · UX 개선(debounce · `keepPreviousData` · 다음 페이지 prefetch) · 상태 계약 테스트(유닛 70 · E2E 16)
- **리뷰 반영** — `keepPreviousData`로 이전 목록을 보는 동안 옛 조건의 없는 페이지를 받던 prefetch 경합을, 트리거를 hover/focus로 옮겨 해소 ([커밋 기록](../../commits/feat/week-05))
## AI 협업 방식
 
AI가 생성한 코드도 머지하는 순간 내 코드라는 원칙으로 작업합니다.
 
- 프로젝트 규칙을 `CLAUDE.md`로 주입하고, 커밋 게이트가 AI 생성 코드에도 동일하게 적용
- 컴포넌트 리뷰 관점을 [`.claude/skills`](.claude/skills)(analyze-component · pattern-review)로 직접 작성해 반복 검증에 활용
- PR 본문에 AI 생성 부분을 표기하고 직접 검토·수정한 내역 기록
## 실행
 
```bash
nvm use          # Node.js 24 (>=22.12.0)
pnpm install
pnpm dev         # 개발 서버
pnpm test        # Vitest 단위·컴포넌트 테스트
pnpm test:e2e    # Playwright E2E
pnpm lint        # ESLint (커밋 시 husky가 자동 실행)
```
 
## 과제 명세
 
주차별 과제 원문은 [`docs/assignments/`](docs/assignments)에 있습니다.
