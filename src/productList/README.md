# ProductListPage 리팩토링 — 관심사 분리 & 버그 수정

500줄 단일 컴포넌트였던 `ProductListPage`를 **Components / Hooks / Services / Utils** 레이어로 분리하고,
그 과정에서 드러난 버그를 함께 고친 기록이다.

```
productList/
├─ ProductListPage.tsx        # 얇은 오케스트레이션 (hook 조합 + JSX)
├─ types.ts · constants.ts
├─ components/  FilterPanel · SearchBar · SortSelect · ViewModeToggle
│               ProductGrid · ProductCard · HighlightedText · Pagination
├─ hooks/       useProductQuery · useProducts · useWishlist
│               useRecentlyViewed · useDebouncedValue
├─ services/    productApi
└─ utils/       formatPrice · getTotalPages · productBadges
```

## 1. 관심사 판별표

| 위치(원래 단일 파일)                                       | 관심사             | 분리 후보                                 | 분리 결과 / 분리하지 않을 근거                   |
| ---------------------------------------------------------- | ------------------ | ----------------------------------------- | ------------------------------------------------ |
| `Product`·`ProductListResponse`·`SortBy` 타입              | 타입               | `types.ts`                                | UI·hook·service 공유 → 최하위 모듈               |
| `CATEGORIES`·`SORT_OPTIONS`·`PAGE_SIZE`                    | 설정/콘텐츠        | `constants.ts`                            | 옵션 콘텐츠·레이어 횡단 값                       |
| `fetch` + `URLSearchParams` 조립                           | API                | `services/productApi`                     | 통신 구현 캡슐화(DIP)                            |
| `products`·`totalCount`·`isLoading`·`error` + fetch effect | 서버 상태          | `useProducts`                             | "언제·어떻게 불러오나"                           |
| `category`·가격·`sort`·`search`·`page`·`inStock` + 핸들러  | 클라 상태          | `useProductQuery`                         | 공유 불변식(필터→1페이지), URL 단일 소스         |
| `wishlist` + localStorage                                  | 클라 상태          | `useWishlist`                             | 저장 동기화                                      |
| `recentlyViewed` + localStorage                            | 클라 상태          | `useRecentlyViewed`                       | 저장 동기화                                      |
| URL 쿼리 동기화                                            | 외부 시스템 동기화 | 라우터 `useSearchParams`                  | `useProductQuery`가 URL을 단일 소스로 읽고 씀    |
| 검색어 디바운스                                            | 로직               | `useDebouncedValue`                       | 범용 재사용                                      |
| 할인율·NEW·HOT·품절·무료배송 규칙                          | 비즈니스 로직      | `utils/productBadges`                     | 순수(JSX 무관)                                   |
| 가격 포맷                                                  | 표시 변환          | `utils/formatPrice`                       | 순수                                             |
| `totalPages` 계산                                          | 파생 계산          | `utils/getTotalPages`                     | 순수                                             |
| 검색어 하이라이팅                                          | UI                 | `HighlightedText`                         | 재사용 표현                                      |
| 상품 카드 JSX                                              | UI                 | `ProductCard`                             | 카드 한 장 표현                                  |
| 그리드 배치·빈 상태                                        | UI                 | `ProductGrid`                             | 목록 배치                                        |
| 필터 패널                                                  | UI                 | `FilterPanel`                             | 필터 입력 묶음                                   |
| 검색·정렬·보기 컨트롤                                      | UI                 | `SearchBar`·`SortSelect`·`ViewModeToggle` | 독립 컨트롤(conjoined 이름 회피)                 |
| 페이지네이션 nav + 번호창                                  | UI                 | `Pagination`                              | nav 위젯                                         |
| **`viewMode`(그리드/리스트)**                              | 화면 상태          | **분리 안 함**                            | 페이지만 읽고 쿼리·URL과 무관 → 페이지 로컬 상태 |
| **스크롤 맨 위 effect**                                    | 외부 동기화        | **분리 안 함**                            | 페이지 1곳, `page` 종속 1줄 → 별도 hook은 과함   |
| **`SIBLING_COUNT`·`SEARCH_DEBOUNCE_MS`**                   | 튜닝 상수          | **colocate**                              | 단일 컴포넌트/페이지 내부 디테일(콘텐츠 아님)    |

## 2. 버그·개선 기록

### 고친 것 (재현 · 원인 · 수정)

1. **재고 필터 시 개수·페이지네이션 어긋남**
   재현: "재고 있는 것만" 켜기. 원인: 클라이언트에서 fetch 후 `filter(stock>0)`라 `totalCount`엔 품절 포함, 페이지당 12개 미만 표시. 수정: `inStock=true`를 **서버 쿼리로** 보내 서버가 필터+페이지네이션.
2. **빈 결과 후 화면 전체가 "로딩 중"으로 사라짐**
   재현: 검색 결과 0개를 만든 뒤 한 글자 더 입력. 원인: `isLoading && products.length === 0` early-return이 **로드 후에도** 걸림. 수정: `isInitialLoading = !hasLoaded`로 **첫 로딩에만** 전체 화면 로딩.
3. **검색 시 키 입력마다 API 요청**
   재현: 검색어 타이핑. 원인: `searchQuery`가 fetch 의존성에 직결. 수정: `useDebouncedValue`로 **fetch 유발 값만** 디바운스(입력창·URL·하이라이트는 즉시값 유지).
4. **API 오류 후 새로고침 없이 재시도 불가**
   재현: 오류 발생 → "다시 시도". 원인: 버튼이 `window.location.reload()`(전체 새로고침). 수정: `useProducts`에 `reloadKey` 기반 **in-app `retry`**.
5. **새로고침·공유 시 필터 사라짐 + URL param 지워짐**
   재현: 필터 적용 후 F5 / URL 공유. 원인: URL에 **쓰기만** 하고 초기 state를 **안 읽음** → 기본값 state가 URL을 덮어씀. 수정: `readInitialQuery`로 **URL에서 초기 state 복원(hydrate)**.

### 안 고친 것 (원인 추정 · 제외 이유)

- **최근 본 상품 표시 UI 없음** — localStorage에 기록만 되고 화면에 노출하는 UI가 없다. 표시는 기능 추가에 해당해 이번 리팩토링에서 제외한다(기록 동작 자체는 정상).
- **`setState`-in-effect 경고(dev)** — fetch effect가 `setIsLoading(true)`를 동기로 호출해 React가 경고한다. dev 전용이고 ESLint는 통과한다. 정석 해결은 데이터 패칭 라이브러리(React Query/SWR)라 이번엔 다루지 않는다.
- **page>1에서 검색 시작 시 fetch 2번** — 검색이 즉시 `page`를 1로 리셋해 한 번, 디바운스 확정으로 한 번 요청한다. 리셋은 존재하지 않는 페이지가 빈 결과로 보이는 것을 막는 정확성 조치라 유지하고, 소량 중복은 감수한다. 없애려면 리셋을 디바운스 확정 시점에 묶어야 해 복잡도가 커진다.
- **`viewMode` 미유지(새로고침 시 그리드로)** — 원본의 URL 동기화에도 viewMode는 없었고 그대로 두었다. viewMode는 "무엇을 보여줄지"가 아니라 "어떻게 보여줄지"라 URL에 넣지 않는다고 판단했다. 유지하려면 localStorage가 적합하다고 생각한다.

### 멘토 피드백 반영 (후속)

1. **빠른 필터 변경 시 옛 응답이 최신을 덮어씀(race condition)**
   재현: 필터를 연속으로 빠르게 전환. 원인: 여러 fetch가 겹칠 때 늦게 도착한 옛 응답이 최신 응답을 덮어쓴다. 수정: effect cleanup에서 `ignore` 플래그를 세워 **뒤늦은 응답의 setState를 무시**한다.
2. **뒤로가기·앞으로가기로 필터가 복원되지 않음**
   재현: 필터 변경 후 브라우저 뒤로가기. 원인: URL에 **쓰기만** 하고(useUrlQuerySync) 상태는 별도 `useState`가 소유해, 히스토리 이동(popstate)이 상태에 반영 안 됨. 수정: `useUrlQuerySync`·hydrate를 걷어내고 **라우터 `useSearchParams`로 URL을 단일 소스화** — 읽기·쓰기를 URL 하나로 모아 뒤로/앞으로가기가 그대로 필터에 반영된다.

## 3. 분리 근거 (한 문장 요약)

- **`useProducts`** — 쿼리로 서버 상품 상태(목록·개수·로딩·에러)를 불러오고 `retry`를 제공한다.
- **`useProductQuery`** — 필터·검색·정렬·페이지 상태를 소유한다. URL이 단일 소스라 라우터 `useSearchParams`로 직접 읽고 쓴다(뒤로가기·앞으로가기·새로고침·공유 유지). 필터 변경 시 첫 페이지로 리셋한다.
- **`useWishlist` / `useRecentlyViewed`** — 각 목록을 localStorage와 동기화하며 토글/추가를 제공한다.
- **`useDebouncedValue`** — 값 변경을 지정 지연만큼 미뤄 반영한다.
- **분리하지 않음**: `viewMode`(페이지만 읽음), 스크롤 effect(1줄·`page` 종속) → 페이지가 소유.

> 리팩토링·버그 수정은 AI로 생성한 뒤 직접 검토·수정했습니다.
