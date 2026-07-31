# RFC: week06 — FSD로 변경 반경을 설계한다

> 이 문서의 baseline은 `main`의 흩어진 구조가 아니라 **이미 FSD 형태로 옮겨진 현재 `feat/week-06`**이다.
> 따라서 이 RFC는 "처음부터 마이그레이션"이 아니라 **이미-FSD인 구조에 남은 문제를 정제하는 이동**을 다룬다.

## 0단계 — 동작 기준선 (마이그레이션 전 스냅샷)

> 폴더 이동 전 커밋(`6d98656`, 이동 전 코드 기준선) 기준. 이동 후 동일 항목을 재확인해 회귀 없음을 증명한다.

| 동작                                                                                    | 확인 방법                                                                                                                                                                          | 결과                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 홈·상품 목록의 정상·로딩·에러·빈 상태                                                   | 정상: `/`·`/products` 진입 / 로딩: DevTools 네트워크 Slow 3G로 스켈레톤 확인 / 빈 상태: `/products?q=존재하지않는상품` / 에러: DevTools request blocking으로 `/api/products*` 차단 | 에러(네트워크 실패): 요청 차단 시 카테고리·정렬·페이지네이션·헤더는 그대로 유지되고 **결과 목록 영역에만** 데이터 없이 `Failed to fetch` 표시 확인 ✅ (조회 실패가 나머지 화면을 가리지 않음 → 4단계 #1 근거). HTTP 500 경로의 API 문구 표시는 `scenario`가 UI에 미배선이라 4단계에서 검증. 정상: 목록·홈 렌더 확인 ✅ / 로딩: 스켈레톤 표시 확인 ✅ / 빈 상태: `조건에 맞는 상품이 없습니다.` 표시 확인 ✅ |
| 검색·카테고리·정렬·페이지네이션                                                         | 검색 `?q=가디건`(2개), 카테고리 `?category=fashion`(6개), 정렬 `?sort=price-desc`, 페이지 `?page=2&pageSize=15` 각각·조합 진입해 목록 갱신 확인                                    | 검색·카테고리·정렬·페이지 표시 모두 URL과 일치하게 갱신 확인 ✅. 잘못된 URL 파라미터(`pageSize=5`, `page=0`, 미지원 category/sort)는 nuqs 파서가 유효값·기본값으로 걸러 안전하게 렌더 확인 ✅ (경계·오류 입력 보존 대상). page가 마지막을 넘으면 뷰가 1페이지로 되돌려 재조회 확인 ✅                                                                                                                       |
| URL 공유·새로고침·뒤로/앞으로 가기                                                      | `/products?category=fashion&sort=price-desc` 복사→새 탭에서 필터·정렬 복원 확인, 새로고침 후 동일, 필터 변경 뒤 뒤로/앞으로 이동 시 이전 URL 상태 복원                             | 새 탭 복원·새로고침 유지·뒤로/앞으로 상태 복원 모두 확인 ✅                                                                                                                                                                                                                                                                                                                                                 |
| 홈·목록에서 장바구니·위시리스트 상태 동기화, 페이지 이동 중 Zustand 상태·헤더 개수 유지 | `/`에서 담기→`/products`로 이동해 헤더 배지 수 유지 확인, 목록에서 위시리스트 토글→홈으로 이동해 동기화 확인                                                                       | 홈에서 담기·찜 시 헤더 배지 증가, `/products` 이동 후 개수 유지, 목록 찜 토글이 홈에 동기화, 새로고침 후 persist 유지 모두 확인 ✅                                                                                                                                                                                                                                                                          |
| `pnpm check` 통과                                                                       | CI 커맨드 실행                                                                                                                                                                     | ✅ test 70 passed / lint / typecheck / build 통과                                                                                                                                                                                                                                                                                                                                                           |

### 마이그레이션 중 발견한 기존 버그

> 구조 변경과 기능 변경은 커밋 분리. 발견 시 `재현 방법 · 원인 · 수정 위치 · 검증 결과`를 기록한다.

| 버그 | 재현 방법 | 원인 | 수정 위치 | 검증 결과 |
| ---- | --------- | ---- | --------- | --------- |
|      |           |      |           |           |

---

## R — Requirements

### 보존할 동작 (기능)

홈·상품 목록·검색·카테고리·정렬·페이지네이션·장바구니·위시리스트. 0단계 기준선의 모든 항목을 이동 후에도 동일하게 유지한다.

### 비기능 요구

- 서버·URL·클라이언트·로컬 상태의 Source of Truth를 폴더 이동으로 바꾸지 않는다. 서버 응답을 Zustand에 복사하거나 URL 상태를 별도 `useState`에 동기화하지 않는다.
- 의존 방향은 상위→하위만. 같은 레이어 슬라이스 간·`entities → features` 역방향 import를 만들지 않는다.
- SSR hydration 전략(`skipHydration` + 마운트 후 `rehydrate`, `useHasHydrated` 게이트)을 cart·wishlist 두 store 모두에 보존한다. 도메인 무지 복원 배관을 `shared/lib/persist`로 일반화해 두 store가 공용하며, 서버·클라 첫 렌더 일치와 복원 전 스켈레톤 표시가 깨지지 않게 한다.
- `pnpm check`(test·lint·typecheck·build)를 각 이동 단계마다 통과시킨다.

### 이번 주에 하지 않을 것과 이유

- **에러 경계 배선(4단계)** — `throwOnError` 전역 정책·컴포넌트 `ErrorBoundary`·공통 `ApiError` 구현은 4단계에서 분리 진행한다(기존 전역 `app/error.tsx`는 유지). 이 RFC의 O·4단계에는 설계만 남긴다.
- **route `loading.tsx` 추가** — 목록 로딩은 Query `isPending`이 스켈레톤을 그리므로 중복이다. O에서 근거를 남긴다.

---

## A — Architecture

### 현재 구조에서 실제로 겪는 문제

1. **entities 순환 의존.** `entities/commerce ↔ entities/cart ↔ entities/wishlist`. store 하나(단일 persist 키)를 세 슬라이스로 쪼갠 탓에, store 조립(commerce→cart·wishlist)과 store 사용(cart·wishlist→commerce)이 서로를 물어 "같은 레이어 슬라이스 직접 import 금지"를 방향과 무관하게 위반한다.
2. **`src/types/commerce.ts` God-file.** 성격이 다른 타입 9개(도메인 `Product`·`Category`·`CategoryId`·`ProductSort`, 조회 `ProductListQuery`, 응답 `ProductListResponse`·`HomeResponse`, 전송 `ApiErrorResponse`, mock 제어 `MockApiScenario`)를 shared·features·entities·app 전부가 import한다. 각 타입의 소유자가 없어, `Product` 형태 하나 바꾸면 전 레이어가 흔들린다.
3. **Public API 부재.** 슬라이스 전부 deep import(`@/features/products/ui/ProductCard`). 경계가 계약으로 표현되지 않아 내부 파일이 그대로 외부 표면이 된다.
4. **`ProductCard`가 표현과 행위를 한 컴포넌트에 묶음.** `features/products/ui/ProductCard`가 상품 "표현"과 담기·찜 "행위"(`entities/cart`·`entities/wishlist` 훅)를 함께 들어, 순수 표현의 재사용 경계와 행위의 소유가 흐리다. 현재 import(`features → entities`)는 정상이지만, 표현을 `entities`로 내리면 `entities → features` 역방향이 되므로 조합 위치를 정해야 한다.
5. **레이어명 혼동.** `src/views`는 FSD Pages 자리인데 비표준 이름이고, `src/app`(Next 예약)과 FSD App/Pages 레이어의 관계가 문서화되어 있지 않다.

### 현재 폴더 트리 (feat/week-06)

```
src/
  app/            api(_data·home·products)· demo· error.tsx· layout· page· providers· products
  entities/       cart(model)· commerce(model)· wishlist(model)
  features/       home(api)· product-options(api·model·ui)· products(api·model·ui: ProductCard 포함)
  shared/         api· lib(cn·select·useMounted)· ui(dialog·loading)
  types/          commerce.ts   ← God-file
  views/          home· products· demo
  widgets/        header
```

### 목표 폴더 트리

```
src/
  app/                              # Next 라우팅 + FSD App 레이어 (역할 겸함, 별도 _app 안 만듦)
    api/                            # mock 백엔드 (전환 제외, 아래 "경계" 참고)
      _data/commerce.ts
      home/route.ts
      products/route.ts             # MockApiScenario 를 이 안으로
    demo/page.tsx  products/page.tsx  layout.tsx  page.tsx  providers.tsx  error.tsx  globals.css
  _pages/                           # views 개명 (FSD Pages 레이어)
    home/    ui(HomeView·HomeSkeleton)  api(queries: homeQueryOptions·HomeResponse)  # features/home 흡수
    products/ui(ProductListView·ProductListResults·ProductSearchInput)
    demo/    ui(DemoView·dialog·select)
  widgets/
    header/ui/Header
    product-card/ui/ProductCard     # features/products/ui 에서 이동
  features/
    products/                       # 상품 목록 브라우징 (검색·필터·정렬·페이지)
      api(queries·ProductListResponse)  model(searchParams·pagination·ProductListQuery)  ui(ProductSection·ProductSkeleton·filterOptions)
    add-to-cart/ui/AddToCartButton      # ProductCard 에서 추출
    toggle-wishlist/ui/WishlistButton
    product-options/api·model·ui        # 유지
  entities/
    product/model/types.ts          # Product·Category·CategoryId·ProductSort
    cart/model/                     # 독립 store (persist "cart")
      cartStore· useCart(useCartCount·useIsInCart·useAddToCart·useRemoveFromCart)
    wishlist/model/                 # 독립 store (persist "wishlist")
      wishlistStore· useWishlist(useWishlistCount·useIsWishlisted·useToggleWishlist)
  shared/
    api/        fetcher· getServerQueryClient· queryClient· types(ApiErrorResponse)
    lib/        cn· useMounted· select· persist(useHasHydrated·useRehydrate — 도메인 무지, 두 store 공용)
    ui/         dialog· loading
```

### 사용할 레이어와 선택 근거

- **app** — Next 라우팅이 강제. FSD App 레이어(전역 provider·layout·전역 스타일·전역 error)의 역할과 정확히 겹치므로 **별도 `src/_app`을 만들지 않고** `src/app`이 겸한다. `page.tsx`는 얇은 진입점으로 두고 실제 조합은 `_pages` 컴포넌트를 렌더한다.
- **\_pages** — 페이지 본문 조합. `src/pages`는 Next Pages Router로 오인되므로 언더스코어를 붙여 `_pages`로 예약 디렉터리와 구분한다. **`home`처럼 재사용이 없어 `feature`로 나눌 수 없는 단일 페이지는 전용 조회·상태(`homeQueryOptions`·`HomeResponse`)를 별도 feature로 빼지 않고 그 `_pages/home` 슬라이스에서 단일로 관리한다** — 불필요한 feature를 만들지 않는 것도 설계다.
- **widgets** — 여러 entity·feature를 조합한 자족 UI 섹션(`Header`, `ProductCard`).
- **features** — 사용자 행위(담기·찜·목록 브라우징·옵션 선택).
- **entities** — 도메인 데이터(`product` 타입, `cart`·`wishlist` 독립 store).
- **shared** — 도메인을 모르는 재사용물(fetcher·cn·headless select·compound dialog). `processes`는 쓰지 않는다.

### 허용/금지 import 예시

```ts
// 허용 (상위 → 하위)
// widgets/product-card/ui/ProductCard.tsx
import { AddToCartButton } from "@/features/add-to-cart"; // widget → feature
import type { Product } from "@/entities/product"; // widget → entity

// 금지 (하위 → 상위: 역방향)
// 가정: ProductCard를 entities/product/ui에 뒀다면 —
import { AddToCartButton } from "@/features/add-to-cart"; // ❌ entity → feature (그래서 widget에 둔다)

// 금지 (같은 레이어 슬라이스 직접 import)
// entities/cart 에서
import { useIsWishlisted } from "@/entities/wishlist"; // ❌ entity ↔ entity
```

### 단계별 마이그레이션 계획과 검증

> 순수 이동과 수정을 분리한다. 각 단계 뒤 `pnpm check` 통과를 검증으로 삼는다.

| 순서 | 작업                                                                                                                                                                            | 성격      | 검증                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------- |
| 1    | 이 RFC 커밋 (파일 이동 전)                                                                                                                                                      | docs      | 커밋 `1a4e619`                        |
| 2    | `views → _pages` 개명                                                                                                                                                           | 순수 이동 | `pnpm check` ✅ · `5b29255`           |
| 3    | `features/home` → `_pages/home` 흡수 (`ui`·`api` 세그먼트)                                                                                                                      | 이동      | `pnpm check` ✅ · `315fa16`           |
| 4    | `types/commerce.ts` 분해 (`HomeResponse`는 `_pages/home/api`로, 나머지 entity·feature·shared·app로)                                                                             | 이동      | `pnpm check` ✅ (해시 step5에서 백필) |
| 5    | `commerceStore`를 `cartStore`·`wishlistStore` 독립 2 store로 분리, 복원 배관 → `shared/lib/persist`, `entities/commerce` 삭제 (persist 키 `commerce-store` → `cart`·`wishlist`) | 이동+수정 | `pnpm check` + import 순환 없음 확인  |
| 6    | `ProductCard` → `widgets/product-card`, 행위 추출 → `features/add-to-cart`·`toggle-wishlist`                                                                                    | 이동+수정 | `pnpm check` + ProductCard 테스트     |
| 7    | 핵심 슬라이스에 Public API `index.ts` 추가                                                                                                                                      | 수정      | `pnpm check`                          |
| 8    | `Header`를 `app/layout`에서 렌더 (각 view의 widget import 제거)                                                                                                                 | 수정      | `pnpm check`                          |

> **순서 근거:** `HomeResponse` 타입 분해(4)를 `features/home` 흡수(3) **뒤**에 둔다. 흡수 전에 `HomeResponse`만 `_pages`로 옮기면 아직 `features/home`에 있는 `homeQueryOptions`가 `_pages`를 import하는 `features → _pages` 역방향이 잠깐 생긴다(typecheck는 통과해 `pnpm check`로 안 걸리므로 순서로 막는다). 홈 쿼리를 먼저 `_pages`로 옮긴 뒤 타입을 그 옆에 둔다.
> **persist 키 변경(5):** 단일 store를 나누며 키가 `commerce-store` → `cart`·`wishlist`로 바뀌어 기존 저장값은 이어지지 않는다. 사용자에게 보이는 동작(담기·찜 유지)은 그대로이며, 실사용자가 없어 데이터 이월은 무의미하다.
> **step 4 — cross-entity 회피:** `Product`를 `entities/product`로 옮기면서 `cart`·`wishlist`가 이를 참조하면 `entities ↔ entities` 같은 레이어 cross-import가 된다. id는 본래 `string`이므로 `ProductId`를 `Product["id"]` → `string`으로 바꿔 의존을 끊었다(cart·wishlist는 id만 저장).

### app/api (mock 백엔드) 경계

`src/app/api`의 Route Handler·fixture는 **전환 범위에서 제외**한다. 프론트엔드(`entities`·`features`)와 mock 백엔드(`app/api`)는 HTTP 경계로 나뉜다. 단, 프론트↔API가 공유하는 계약 타입(`Product`·`Category`·`ProductSort`)은 `entities/product/model`에 두어, 양쪽이 한 곳을 아래로 import한다(`app/api` → `entities`는 하위 참조라 합법). mock 전용 제어값 `MockApiScenario`는 `app/api` 내부에만 둔다.

### 데모 전용 코드 처리 (dialog·select·product-options·demo)

`shared/ui/dialog`·`shared/lib/select`·`features/product-options`·`_pages/demo`는 **현재 데모 페이지에서만** 쓰인다(커머스 흐름은 사용하지 않음). 그럼에도 **삭제하지 않고 유지**한다 — headless select·compound dialog는 향후 실제 기능(옵션 선택·확인 모달 등)에 재사용할 프리미티브이기 때문이다. 배치는 이미 올바르다(도메인 무지 프리미티브는 `shared`, 옵션 선택은 `features`, 쇼케이스는 Pages). 이번 이동은 `views/demo → _pages/demo` 개명뿐이다.

| 대상                                    | 현재 소비처    | 결정         | 근거                                                 |
| --------------------------------------- | -------------- | ------------ | ---------------------------------------------------- |
| `shared/ui/dialog`, `shared/lib/select` | 데모           | 유지         | 도메인 무지 재사용 프리미티브, 향후 기능에 사용 예정 |
| `features/product-options`              | 데모           | 유지         | 옵션 선택 feature, 향후 상세 페이지에 사용 예정      |
| `_pages/demo`                           | 라우트 `/demo` | 유지(개명만) | 프리미티브 쇼케이스, 학습·회귀 확인용                |

### A — 파일 매핑표

| 현재 위치                                                     | 목표 위치                                                                | 레이어 / 슬라이스 / 세그먼트               | 이동 또는 유지하는 이유                                                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `views/**`                                                    | `_pages/**`                                                              | \_pages                                    | FSD Pages 레이어 관례, `src/pages` 오인 회피                                                                           |
| `types/commerce.ts` (Product·Category·CategoryId·ProductSort) | `entities/product/model/types.ts`                                        | entities/product/model                     | 도메인 명사·어휘의 소유자는 product entity                                                                             |
| `types/commerce.ts` (ProductListQuery)                        | `features/products/model`                                                | features/products/model                    | 조회 계약이라 명사가 아닌 브라우징 feature 소유                                                                        |
| `types/commerce.ts` (ProductListResponse)                     | `features/products/api`                                                  | features/products/api                      | 목록 fetch를 소유한 feature의 응답 계약                                                                                |
| `types/commerce.ts` (HomeResponse)                            | `_pages/home/api`                                                        | \_pages/home/api                           | 홈 페이지 전용 응답, 재사용 없음                                                                                       |
| `types/commerce.ts` (ApiErrorResponse)                        | `shared/api/types.ts`                                                    | shared/api                                 | 전송 계층 에러, 도메인 무지                                                                                            |
| `types/commerce.ts` (MockApiScenario)                         | `app/api` 내부                                                           | app                                        | mock 백엔드 전용 제어값                                                                                                |
| `features/home/api/queries.ts`                                | `_pages/home/api/queries.ts`                                             | \_pages/home/api                           | 홈 전용 조회라 feature 불필요                                                                                          |
| `entities/commerce/model/**` (store·types·복원)               | `entities/cart/model` + `entities/wishlist/model` + `shared/lib/persist` | entities/cart·wishlist, shared/lib/persist | 단일 store를 독립 2 store로 분리해 순환 제거. cart·wishlist는 각 entity에 자기 store, 도메인 무지 복원 배관은 shared로 |
| `features/products/ui/ProductCard.tsx`                        | `widgets/product-card/ui/ProductCard.tsx`                                | widgets/product-card                       | 표현+행위 조합체 → widget                                                                                              |
| (신규) 담기 버튼                                              | `features/add-to-cart/ui/AddToCartButton.tsx`                            | features/add-to-cart                       | 사용자 행위(동사)                                                                                                      |
| (신규) 찜 버튼                                                | `features/toggle-wishlist/ui/WishlistButton.tsx`                         | features/toggle-wishlist                   | 사용자 행위(동사)                                                                                                      |
| `widgets/header/**`                                           | 유지                                                                     | widgets/header                             | 여러 entity를 조합한 자족 섹션 = widget (전역 표시는 widget 근거)                                                      |
| `shared/lib/select`, `shared/ui/dialog`, `shared/ui/loading`  | 유지                                                                     | shared                                     | 도메인 무지 재사용물, 이미 올바른 자리                                                                                 |
| `features/product-options/**`                                 | 유지                                                                     | features/product-options                   | 옵션 선택 feature, 이미 올바른 자리                                                                                    |

### A — 애매한 파일 결정표

| 대상                              | 후보 A                                                          | 후보 B                                  | 최종 결정 | 기준                                                                                                                                                                                                                                                       |
| --------------------------------- | --------------------------------------------------------------- | --------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProductCard`                     | `entities/product/ui` (순수 표현 + actions 슬롯)                | `widgets/product-card` (표현+행위 조합) | **B**     | 홈·목록 어디서도 "액션 없는 순수 카드" 수요가 없어 entities/ui는 성급한 추상화. widget이면 `entities→features` 역방향도 원천 제거                                                                                                                          |
| cart·wishlist store               | 독립 2 store (`entities/cart`·`entities/wishlist` 각자 persist) | 단일 store를 `entities/commerce`로 통합 | **A**     | 순환 제거 + 삭제 테스트가 폴더 단위로 완전 응집(위시리스트 제거 = `entities/wishlist` 폴더 삭제, 다른 store 무손상). 단일 store의 'commerce 세그먼트 편집' 대가를 없앰. persist 키 2개·복원 2회는 사소하며 도메인 무지 배관(`shared/lib/persist`)으로 흡수 |
| 담기·찜 행위                      | 상태·행위 모두 entities                                         | 행위만 features로                       | **B**     | 상태(장바구니 내용물)=도메인 데이터=entity, 행위(버튼)=사용자 인터랙션=feature                                                                                                                                                                             |
| `src/types/commerce.ts`           | `shared/types`에 유지                                           | 도메인별 소유자로 분해                  | **B**     | "이 타입의 소유자는 누구인가"에 답. 한 창고 결합(문제 2)을 해소                                                                                                                                                                                            |
| `ProductListQuery`                | `entities/product/model`                                        | `features/products/model`               | **B**     | 도메인 명사가 아니라 "어떻게 조회하나"의 계약. `searchParams`·`pagination`과 한 슬라이스에 응집                                                                                                                                                            |
| `HomeResponse`·`homeQueryOptions` | `features/home`                                                 | `_pages/home`                           | **B**     | 홈 페이지 전용, 재사용 없음 → 얇은 feature를 만들지 않는 것도 설계                                                                                                                                                                                         |
| 복원 헬퍼(`useHasHydrated` 등)    | `shared/lib/persist`로 일반화                                   | 각 entity에 중복                        | **A**     | store가 둘이 되어 같은 배관이 2회 반복 → 도메인 무지 일반화가 정당(반복 2회 규칙). cart·wishlist가 각자 store를 인자로 넘겨 재사용                                                                                                                         |
| Pages 레이어명                    | `views` 유지                                                    | `_pages` 개명                           | **B**     | FSD 관례, `src/pages`(Pages Router) 오인 회피, `src/app`(App 레이어)과 구분                                                                                                                                                                                |

---

## D — 상태 분류표 (새 구조 기준)

| 상태             | Source of Truth                | 소유 슬라이스/레이어                                 | 소비하는 곳                                  | 이동 후에도 중복 저장하지 않는 방법                                                       |
| ---------------- | ------------------------------ | ---------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 상품 조회 결과   | 서버 / TanStack Query          | `features/products/api`(목록), `_pages/home/api`(홈) | `_pages/products`, `_pages/home`             | 서버 응답을 store에 복사하지 않음. queryKey를 정규화 요청값으로 두어 프리패치 캐시 재사용 |
| 검색·정렬·페이지 | URL / nuqs                     | `features/products/model`(searchParams)              | `_pages/products`                            | URL이 SoT. 별도 `useState`로 동기화하지 않음                                              |
| 장바구니         | Zustand persist(키 `cart`)     | `entities/cart/model`                                | `widgets/header`, `features/add-to-cart`     | id 배열만 저장, 이름·가격은 서버 응답이 소유. 개수는 length로 파생                        |
| 위시리스트       | Zustand persist(키 `wishlist`) | `entities/wishlist/model`                            | `widgets/header`, `features/toggle-wishlist` | id 배열만 저장, 상세는 서버 응답이 소유. 개수는 length로 파생                             |
| Dialog 열림 여부 | React 로컬 상태                | `shared/ui/dialog`(해당 UI)                          | 해당 UI                                      | 로컬 상태/컨텍스트로만, 외부 저장소에 두지 않음                                           |

---

## I — Interface

### 각 슬라이스의 공개 / 숨김

| 슬라이스                   | 공개(계약)                                                                                          | 숨김(내부 세부)                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `entities/cart`            | `useCartCount`·`useIsInCart`·`useAddToCart`·`useRemoveFromCart`·`useCartHydrated`·`useHydrateCart`  | `cartStore` 인스턴스, persist·sanitize 설정     |
| `entities/wishlist`        | `useWishlistCount`·`useIsWishlisted`·`useToggleWishlist`·`useWishlistHydrated`·`useHydrateWishlist` | `wishlistStore` 인스턴스, persist·sanitize 설정 |
| `shared/lib/persist`       | `useHasHydrated(store)`·`useRehydrate(store)` (제네릭, **각 entity가 자기 store로 감싸 소비**)      | 복원 구독·`onFinishHydration` 세부              |
| `entities/product`         | `Product`·`Category`·`CategoryId`·`ProductSort` 타입                                                | (model만)                                       |
| `features/products`        | `productListQueryOptions`·`ProductListResponse`·`productSearchParsers`·UI(`ProductSection` 등)      | 정규화·페이지네이션 내부                        |
| `features/add-to-cart`     | `<AddToCartButton>`                                                                                 | 담기/빼기 토글 내부 로직                        |
| `features/toggle-wishlist` | `<WishlistButton>`                                                                                  | 토글 내부 로직                                  |
| `widgets/product-card`     | `<ProductCard>`                                                                                     | 표현+행위 조합 방식                             |
| `shared/ui/dialog`         | compound `Dialog.*`                                                                                 | 오버레이·포털·컨텍스트 세부                     |
| `shared/lib/select`        | `useSelect` + `getXxxProps`                                                                         | 키보드·포커스 상태 관리                         |

> **hydration 배선:** store 인스턴스는 Public API로 숨기므로, 제네릭 `useHasHydrated(store)`·`useRehydrate(store)`(shared/lib/persist)는 각 entity가 **자기 store로 감싸** `useCartHydrated`·`useHydrateCart` 등으로 공개한다. `Header`는 `useCartHydrated()`·`useWishlistHydrated()`를 조합해 게이트하고, `providers`는 `useHydrateCart()`·`useHydrateWishlist()`로 두 store를 마운트 후 복원한다. 두 store가 독립이라 각 개수는 자기 store의 복원 여부로만 게이트된다.

### `ProductCard`와 장바구니·위시리스트 행위의 조합

`ProductCard`는 `widgets/product-card`에서 `entities/product`(타입·표현)와 `features/add-to-cart`·`features/toggle-wishlist`(버튼)를 **직접 조합**한다. widget이 feature를 import하는 것은 상위→하위라 합법이며, `entities → features` 역방향이 원천적으로 발생하지 않는다.

```tsx
// widgets/product-card/ui/ProductCard.tsx
import { AddToCartButton } from "@/features/add-to-cart";
import { WishlistButton } from "@/features/toggle-wishlist";
// ...상품 표현 + <AddToCartButton productId={id}/> + <WishlistButton productId={id}/>
```

### Public API 사용 여부와 방식

**"경계를 계약으로 표현할 것이 있는 슬라이스에만" `index.ts`를 둔다.** 습관적 `export *` barrel은 만들지 않는다.

- **둔다** — `entities/cart`·`entities/wishlist`(각 store 내부 은닉), `entities/product`, `features/*`, `widgets/product-card`, `shared/ui/dialog`, `shared/lib/select`. 외부는 공개 훅·컴포넌트만 알면 되고 내부 파일은 감춘다.
- **안 둔다** — `shared/lib/cn` 같은 단일 유틸. 파일 경로가 곧 계약이라 `index.ts`는 barrel일 뿐이다.

---

## O — Optimization

### TanStack Query 캐시 정책 — 유지

폴더 이동으로 캐시 정책을 바꾸지 않는다. 목록은 `staleTime` 1분·`keepPreviousData`·`gcTime` 기본(5분)을 유지하고, `queryKey`를 정규화 요청값으로 두어 서버 프리패치와 클라이언트가 같은 키로 캐시를 재사용한다. 홈도 현행 유지.

### 로딩 경계

목록 로딩은 Query `isPending`이 `ProductListResults`에서 스켈레톤으로 그린다. route `loading.tsx`/Suspense는 **추가하지 않는다** — 같은 범위를 두 번 덮어 중복이기 때문이다. `isPending`은 조건 변경 시 부분 로딩까지 표현하므로 이 화면엔 이쪽이 맞다.

### 에러 경계 (설계만, 구현은 4단계)

- **인라인** — 4xx·빈 결과·네트워크 실패는 `ProductListResults` 자리 안에서 표시한다(나머지 화면을 가리지 않음). 0단계에서 이 경계가 이미 동작함을 확인했다.
- **경계 전파** — 5xx는 결과 영역을 감싼 컴포넌트 `ErrorBoundary`로(헤더·필터 유지), 예상 밖 렌더링 오류는 전역 route `error.tsx`로 전파하고 `reset`을 제공한다. `throwOnError` 기준(5xx→경계, 4xx·빈결과·네트워크→인라인)은 4단계에서 배선한다.
- **단일 에러 관문** — `shared/api/fetcher`가 `!response.ok`를 throw로 바꿔 Query의 `isError`·`error.message`로 흘려보낸다. 화면별 문구는 shared에 넣지 않는다.

### 이번 주에 하지 않을 최적화

- route `loading.tsx` 추가(위 근거).
- 코드 스플리팅·번들 최적화(구조 정제와 무관).

---

## FSD 이해 확인 질문

1. **`ProductCard`가 찜 버튼을 직접 import하면?** `ProductCard`가 entities에 있다면 `entities → features` 역방향 의존이 된다. 그래서 `ProductCard`를 `widgets/product-card`에 두고, widget에서 `features/add-to-cart`·`toggle-wishlist`를 조합한다.
2. **한 페이지에서만 쓰는 검색 로직도 feature여야 하나?** 아니다. 재사용·독립 능력일 때 feature다. 홈 조회(`homeQueryOptions`)는 홈 전용이라 `_pages/home`에 co-locate했고, 목록 브라우징(검색·필터·정렬)은 재사용 능력이라 `features/products`로 두었다.
3. **`formatPrice`는 항상 `shared/lib`인가?** 순수 포맷이면 그렇다. 통화·회원 등급·상품 정책이 끼면 도메인을 알게 되어 shared 자격을 잃고 `entities`/`features`로 올라간다.
4. **두 feature가 협력할 때 어디서 조합했나?** 직접 import하지 않고 상위인 `widgets/product-card`(또는 `_pages`)에서 조합한다.
5. **폴더 이동 후에도 Query·Zustand 데이터를 서로 복사하지 않은 이유?** 각자 SoT가 다르다. 서버 결과는 Query, 로컬 표시는 Zustand. 장바구니는 id만 저장하고 상품 상세는 서버 응답이 소유해, 복사하면 두 값이 어긋난다.
6. **barrel과 Public API의 차이, 무엇을 선택했나?** barrel은 경로 단축용 습관적 재수출이고, Public API는 "외부가 알아도 되는 것은 이것뿐"이라는 계약이다. 경계를 표현할 것이 있는 슬라이스에만 `index.ts`(Public API)를 두고, 단일 유틸은 deep import로 남겼다.

---

## 4단계 — 에러 처리 설계

> 현재는 TanStack Query의 `isLoading`·`isError`·`error`로 **인라인 처리만** 한다(`throwOnError`·React `ErrorBoundary` 없음). `app/error.tsx`(전역 route 경계)는 있으나 쿼리가 인라인 처리해 도달하지 않는다.
> 방향: **공통 ErrorBoundary로 전부 바꾸지 않는다.** 복구 가능한 오류는 인라인으로 두어 부분 실패가 화면 전체를 가리지 않게 하고, 예상 밖 오류만 경계로 전파한다. 표는 설계, 재현 결과는 구현 시 채운다.

### 실패 유형별 처리

| 실패 유형                                  | 처리 위치                           | Error Boundary 전파 | 사용자 UI                        | 재시도 방법                          | 이 경계를 선택한 이유                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------ | ----------------------------------- | ------------------- | -------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 상품 목록 조회 실패(5xx)                   | 컴포넌트 `ErrorBoundary`(결과 영역) | 예                  | 결과 영역 fallback + "다시 시도" | `reset()`(전체 새로고침 없이 재조회) | 예상 밖 서버 오류라 경계로 전파하되, route 전체가 아닌 결과 영역만 감싸 헤더·필터를 살린다(요구 #1)                                                                                                                                                                                                                                                                                                                                                             |
| 잘못된 검색 조건(4xx)                      | `ProductListResults`(인라인)        | 아니오              | 결과 영역 메시지                 | URL 조건 수정 / refetch              | 사용자가 조건만 바꾸면 복구. 나머지 화면 유지                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 네트워크 실패                              | `ProductListResults`(인라인)        | 아니오              | 결과 영역 메시지                 | refetch                              | 일시적, 재요청으로 복구. 나머지 화면 유지                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 예상하지 못한 렌더링 오류                  | route `error.tsx`(경계)             | 예                  | 전역 fallback + `reset`          | `reset()`                            | 복구 지점 불명, 경계가 유일한 안전망                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 장바구니 행위의 비즈니스 오류              | 해당 없음(현재)                     | —                   | —                                | —                                    | mock이 담기·찜 실패를 내지 않음. 서버 검증(재고·중복)이 붙으면 이벤트 핸들러에서 인라인 처리(토스트)                                                                                                                                                                                                                                                                                                                                                            |
| 클라이언트 저장소 오류(localStorage quota) | persist storage 어댑터              | 아니오              | (해당 없음)                      | —                                    | **현재 해당 없음** — persist가 id 배열만 저장해 수 KB 수준이라 quota 초과 불가. 쿼리·렌더 경계와 무관한 저장소 부류라 `throwOnError`·ErrorBoundary가 잡지 못함. **읽기 손상(형태 불일치)은 persist의 zod `.catch()` sanitize가 안전 기본값으로 이미 복구**하므로 별도 방어가 필요 없다. **향후 조건**: 상품 상세를 통째로 저장하거나 항목 수가 무제한으로 늘면 write 경로의 storage 어댑터 `try/catch`(quota 시 저장 건너뜀/오래된 항목 evict) + 개수 상한 필요 |

### 전파 기준 (`throwOnError`) — 쿼리는 전역, 뮤테이션은 개별

`throwOnError`는 `(error) => boolean` 함수를 받으므로, 정책을 한 곳에 둔다.

- **useQuery → QueryClient 전역 default에 정책 함수.** `shared/api/queryClient`의 `defaultOptions.queries.throwOnError = (error) => isServerError(error)`. 5xx·미상만 `true`(경계), 4xx·빈결과·네트워크는 `false`라 화면 안에서 `isError`로 처리된다. "복구 가능=인라인"이 함수가 `false`를 반환해 자동으로 지켜지며, 정책을 쿼리마다 반복하지 않는다. 예외 쿼리만 `useQuery({ throwOnError })`로 개별 override.
- **useMutation → per-call.** 담기·찜·결제는 실패 UX가 행위마다 다르고(토스트·인라인·다이얼로그), 뮤테이션 오류는 이벤트 핸들러에서 나 경계가 못 잡는다. 던지지 않고 `onError`/`isError`로 행위별 인라인 처리한다.
- 이 기준은 위 표의 `전파` 열과 일치해야 한다.

### 전제 — 공통 에러 타입 (4단계 #4)

현재 `fetcher`는 `throw new Error(message)`로 상태 코드를 버려, 전역 정책이 5xx/4xx를 판별할 수 없다. 그래서 `shared/api`에 네트워크·HTTP·비즈니스를 구분하는 공통 에러 타입을 둔다.

```ts
// shared/api
class ApiError extends Error {
  constructor(
    public kind: "network" | "http" | "business",
    public status: number | null,
    message: string,
  ) {
    super(message);
  }
}
// HTTP 실패(4xx·5xx)               → ApiError("http", response.status, message)
// fetch reject(오프라인 등)         → ApiError("network", null, message)
// 비즈니스 오류(정상 응답 + 에러 코드 payload, 예: 재고 부족) → ApiError("business", status, message)
const isServerError = (e: unknown) =>
  e instanceof ApiError && e.kind === "http" && (e.status ?? 0) >= 500;
```

세 kind로 네트워크·HTTP·비즈니스를 구분한다(과제 #4). `business`는 현재 mock에 없어 **미사용**이나, 서버 검증(재고·중복)이 붙으면 이 kind로 구분해 **경계로 전파하지 않고** 이벤트 핸들러에서 인라인(토스트) 처리한다. 화면별 문구·행위는 `shared`에 넣지 않는다 — `shared`는 오류의 **분류**만 제공하고, 표시 문구는 소비 레이어가 정한다.

### 경계 세분화

- route `error.tsx`는 세그먼트 전체를 잡는다. **헤더·필터를 살린 채 목록만 경계로 처리**하려면 `ProductListResults`를 감싼 컴포넌트 단위 `ErrorBoundary`(+`QueryErrorResetBoundary`)를 쓴다. 0단계에서 확인한 "결과 영역만 실패, 나머지 유지"를 경계 방식으로도 유지하려는 선택이며, `reset()`이 전체 새로고침 없이 해당 쿼리만 재조회한다.
- **route 세그먼트 error.tsx는 기존 전역 `app/error.tsx`를 그대로 쓴다**(예상 밖 렌더링 오류의 fallback+`reset`, 요구 #3). 목록 조회 실패는 위 컴포넌트 경계가 더 좁게 처리하므로 **`app/products/error.tsx`는 따로 두지 않는다**(중복). 필요해지는 조건: 목록 페이지의 결과 영역 **바깥**(필터 UI 등)에서 렌더링 오류가 잦아 products 세그먼트만 격리하고 싶을 때.

### 경계가 못 잡는 것

React `ErrorBoundary`는 **이벤트 핸들러·비동기 콜백의 오류를 자동으로 잡지 못한다.** 담기·찜 같은 이벤트에서 나는 오류는 경계로 가지 않으므로, 해당 핸들러 안에서 인라인(토스트·인라인 메시지)으로 처리한다.

### 로딩 경계와의 구분

route `loading.tsx`/Suspense는 라우트 전환의 초기 로딩을, Query `isPending`은 조건 변경 시 데이터 로딩을 맡는다. 현재 목록은 `isPending`이 스켈레톤을 그리므로 route `loading.tsx`는 추가하지 않는다(중복).

> 검증용 `scenario`는 mock 전용 제어값이다. 사용자 URL·`ProductListQuery`에 넣지 않는다. 임시 `throw`로 `error.tsx`를 검증했다면 검증 후 제거한다.

## 5단계 — 삭제 시나리오 자가 검증

> 이동 전 **예상**을 목표 트리 기준으로 먼저 적는다. 이동 후 실제와 대조해 응집을 검증한다.

### 위시리스트 기능을 통째로 제거한다면 (예상)

- **삭제할 폴더·파일**: `entities/wishlist/` 전체, `features/toggle-wishlist/` 전체
- **수정할 파일**: `widgets/header/ui/Header.tsx`(찜 개수·`useWishlistHydrated` 제거), `widgets/product-card/ui/ProductCard.tsx`(`WishlistButton` 제거), `app/providers.tsx`(`useHydrateWishlist` 호출 제거)
- **판정(예상)**: 삭제 대상이 `entities/wishlist`·`features/toggle-wishlist` 두 폴더로 완전 응집한다. 독립 store라 다른 store(cart)를 전혀 건드리지 않고, 수정은 명시적 소비처(Header·ProductCard·providers) 세 곳뿐이라 grep 없이 예측 가능 → 응집 성공. 독립 2 store 선택 덕에 단일 store의 '세그먼트 편집' 대가가 사라진 것이 이 시나리오에서 그대로 드러난다.

### 신상품 뱃지를 상품 카드에 추가한다면 (예상)

- **터치할 파일**: `widgets/product-card/ui/ProductCard.tsx`(뱃지 렌더)가 중심. 판정 기준을 기존 `Product.createdAt` 파생으로 두면 이 한 곳뿐. 새 필드(`isNew`)가 필요하면 `entities/product/model/types.ts` + mock 데이터(`app/api/_data/commerce.ts`)까지.
- **판정(예상)**: 표현 변경이라 `widgets/product-card` 한 곳이 중심이고 자신 있게 예측 가능 → 경계 양호.

## Advanced A — 의존성 하네스 (계획, 선택)

RFC 전체가 세운 import 불변식을 사람 눈이 아니라 도구로 강제한다. 최소 2개 규칙을 자동 검증한다.

1. 하위 레이어가 상위 레이어를 import하지 않는다(역방향 금지).
2. 같은 레이어의 서로 다른 슬라이스를 직접 import하지 않는다.

도구 후보: `eslint-plugin-import`의 `no-restricted-imports` zones, `eslint-plugin-boundaries`, `@feature-sliced/steiger`. 구현은 Advanced라 선택이며, 이번 주엔 규칙 설계까지 기록하고 도입 시 `eslint.config.mjs`에 추가한다.

## Advanced B — 변경 반경 실험 (구현 전 예상, 실제는 이동 후 대조)

> 두 요구사항의 변경 반경을 이동 전에 예측한다. 실제 구현·diff 대조는 이동 후 `실제 결과`·`차이` 열을 채운다. 새 행위는 page 또는 widget에서 조합하고, feature가 다른 feature를 직접 import하거나 무관한 `shared`를 여럿 건드리면 경계를 재검토한다.

### B-1. 검색·카테고리·정렬 조건 전체 초기화

- **새 feature 슬라이스 필요?** 아니오(예상). 초기화는 상품 목록 브라우징의 일부이고, 기존 URL 상태(`features/products/model/searchParams`)를 기본값으로 되돌리는 한 동작이다. 새 슬라이스 대신 기존 `features/products`에 리셋 헬퍼를 두거나 `_pages/products`의 버튼이 `setQuery`로 기본값을 쓴다.

| 관점              | 구현 전 예상                                                                                                                 | 실제 결과 | 차이가 난 이유 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------- | -------------- |
| 수정한 슬라이스   | `_pages/products`(초기화 버튼) + `features/products/model`(기본값·리셋 헬퍼, 필요 시)                                        | (이동 후) | (이동 후)      |
| 변경한 Public API | `features/products`가 이미 `productSearchParsers`(기본값) 공개 → 그걸 쓰면 변경 없음. 리셋 헬퍼를 공개하면 `index.ts`에 추가 | (이동 후) | (이동 후)      |
| 새로 생긴 의존    | `_pages/products → features/products`(이미 존재). 새 역방향·같은 레이어 cross 없음                                           | (이동 후) | (이동 후)      |

### B-2. 장바구니 전체 비우기 (위시리스트도 대칭)

- **새 feature 슬라이스 필요?** 예(예상). "전체 비우기"는 버튼 UI(+확인 다이얼로그)를 가진 사용자 행위라 `features/clear-cart`가 정당하다. 상태 변경(`clearCart`)은 store라 `entities/cart`에 둔다(상태=entity, 행위=feature).

| 관점              | 구현 전 예상                                                                                                                                                    | 실제 결과 | 차이가 난 이유 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------- |
| 수정한 슬라이스   | `entities/cart`(`clearCart` 액션·`useClearCart` 추가) + `features/clear-cart`(신규 버튼, 확인은 `shared/ui/dialog`) + 배치처(`widgets/header` 또는 장바구니 뷰) | (이동 후) | (이동 후)      |
| 변경한 Public API | `entities/cart` `index.ts`에 `useClearCart` 추가, `features/clear-cart` `index.ts`(신규) `<ClearCartButton>`                                                    | (이동 후) | (이동 후)      |
| 새로 생긴 의존    | `features/clear-cart → entities/cart`·`shared/ui/dialog`(하위, 정상), 배치처 → `features/clear-cart`(하위). feature→feature 없음                                | (이동 후) | (이동 후)      |

- **2 store 응집 검증(예상):** `clear-cart`는 `entities/cart`만 건드리고 `entities/wishlist`는 전혀 손대지 않는다 → 독립 2 store 결정이 변경 반경에서도 격리됨을 증명한다. 위시리스트 비우기는 `entities/wishlist` + `features/clear-wishlist`로 대칭이다.

## AI 활용 내역

### AI가 생성·제안한 것

RFC 초안 구조(RADIO), 현재 import 맵 분석과 순환 의존 발견, 에러 taxonomy(서버·렌더·뮤테이션·저장소), 각 결정의 후보·트레이드오프 정리.

### 사람이 검토·판단·수정한 지점

- **store 구조 재검토 → 최종 독립 2 store** — 초기엔 "한 상품을 향한 하나의 컬렉션 도메인"이라는 근거로 단일 store 통합을 택했으나, 삭제 테스트 응집(위시리스트 = 폴더 통째 삭제)과 entity 독립을 다시 따져 **독립 2 store로 전환**. AI의 초기 추천과 결론은 같으나, 단일 store의 트레이드오프를 비교한 뒤 직접 결정.
- **ProductCard 위치 변경** — AI 권장은 `entities/product/ui`(순수 표현+슬롯)였으나, 순수 카드 수요가 없어 `widgets/product-card`로 변경.
- **store 배치 확정** — store를 `app`·`shared`로 올리는 안을 검토했으나 의존 방향 규칙으로 부적합을 확인하고 `entities`(cart·wishlist 각 슬라이스)로 확정.
- **세부 결정** — `ProductListQuery`는 features(후보 B), `features/products` 이름 유지, `views→_pages` 개명 등 최종 결정은 직접 내림.

### AI 추천을 리뷰 후 수용한 추가 항목

아래 셋은 AI가 추가로 추천했고, 직접 리뷰·수용하여 반영했다.

1. **의존성 하네스 계획** — import 불변식의 기계 강제.
2. **AI 활용 내역 기록** — 수용·반려 근거 남기기.
3. **5단계 삭제 시나리오 예상** — 이동 전 예측을 미리 기록.

저장소 오류(localStorage quota) 행은 persist로 localStorage를 쓰므로 taxonomy 완결을 위해 추가했다.

### architecture-review SKILL

FSD 구조 점검용 `architecture-review` SKILL을 `~/.claude/skills/architecture-review/SKILL.md`에 작성했다. 폴더를 레이어로 매핑하고 import 방향 위반·같은 레이어 슬라이스 간 직접 의존·entities의 상위 침범·shared의 비즈니스 로직을 점검하되, **코드 수정안이 아니라 구조적 판단만** 내도록 제약했다. 마이그레이션 완료 후 이 SKILL로 실제 구조를 점검하고, 지적 중 **수용한 것과 반려한 것을 각각 근거와 함께** 이 절에 추가한다(현재는 이동 전이라 미실행).

### 검증

`pnpm check` — test 70 passed / lint / typecheck / build 통과. 이동 단계마다 재검증 예정.
