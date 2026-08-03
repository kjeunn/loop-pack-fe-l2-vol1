---
name: architecture-review
description: 폴더 구조를 FSD 레이어로 매핑하고 import 방향 위반·슬라이스 간 직접 의존·entities의 상위 레이어 침범·shared의 비즈니스 로직 포함을 구조적으로만 점검한다. "FSD 구조 리뷰해줘", "import 방향 점검", "레이어 위반 봐줘", "아키텍처 리뷰", "/architecture-review" 같은 요청에 사용한다. 코드 수정안이 아니라 구조적 판단만 제공한다.
---

# Architecture Review (FSD)

`src/`의 폴더를 FSD 레이어로 매핑하고, 레이어·슬라이스 경계가 지켜졌는지 **구조적으로만** 판정한다. 위반은 `위치 · 어긴 규칙 · 왜 경계 위반인가`로 짚는다. **코드 diff·리팩터 구현은 내지 않는다** — "이 파일은 어느 레이어가 맞다", "이 import는 역방향이다" 같은 판단까지만 제공하고, 고치는 코드는 작성하지 않는다.

## 레이어 모델

```
app → _pages → widgets → features → entities → shared
▲ 상위(조합)                              하위(기반) ▼
```

- **import은 상위→하위만.** 화살표 방향으로만 의존한다.
- **하위 참조는 인접 레이어가 아니라 모든 하위 레이어가 허용된다.** `widget → entities`(features 건너뜀)는 정상이다.
- **`shared` 내부의 cross-import는 허용된다**(shared·app은 슬라이스로 나누지 않으므로). 슬라이스 경계 위반 판정은 비즈니스 레이어(`entities·features·widgets·_pages`)에만 적용한다.
- **`import type`도 의존으로 센다.** 타입만 가져와도 두 슬라이스가 결합된다.
- `src/app`은 Next 라우팅이자 FSD App 레이어를 겸한다(별도 `_app` 없음). `page.tsx`는 얇은 진입점.
- Pages 레이어는 `_pages`(예약어 `pages` 회피).
- `shared`와 `app`은 비즈니스 슬라이스로 나누지 않는다. `processes`는 쓰지 않는다.
- 세그먼트는 목적을 드러낸다: `ui / model / api / lib / config`. `components / hooks / types / utils`처럼 파일 종류만 반복하지 않는다.

## 절차

1. **폴더→레이어 매핑.** `src/*` 최상위를 레이어로 매핑하고, 각 레이어 안 슬라이스(도메인 폴더)를 나열한다.
2. **경계 넘는 import 수집.** `grep -rn 'from "@/' src`로 `@/` import를 모으고, **상대경로도 함께** 본다 — `grep -rn 'from "\.\.' src`로 슬라이스를 벗어나는 `../` import를 잡는다(콜로케이트 에셋 `*.module.css`만 예외). `export … from`(재수출)·`import()`(동적)도 포함한다. 각 import를 `(출발 레이어/슬라이스) → (도착 레이어/슬라이스)`로 환산하되 **같은 슬라이스 내부는 제외**한다.
3. **렌즈별 판정.** 아래 렌즈로 위반을 찾는다.
4. **보고.** 위반마다 `파일:위치 · 어긴 규칙 · 판정`. 위반 없으면 통과로 명시.

## 리뷰 렌즈

### 1. import 방향 (역방향 금지)

- 하위 레이어가 상위 레이어를 import하지 않는지 본다. `entities → features`, `shared → entities`, `features → _pages`가 대표적 역방향이다.
- 특히 `shared`가 무엇이든 위를 import하면 최하위 규칙 위반이다.

### 2. 같은 레이어 슬라이스 간 직접 import

- 같은 레이어의 다른 슬라이스를 직접 import하지 않는지 본다: `features/A → features/B`, `entities/cart → entities/wishlist`.
- **서로 물어 순환(A→B→A)이 생기면 가장 심각한 형태다** — 방향과 무관하게 두 슬라이스가 분리 불가능해진다. 최우선으로 보고한다.
- 두 슬라이스가 협력해야 하면 상위(widget·page)에서 조합한다. 같은 **슬라이스 안** 세그먼트끼리(`entities/cart`의 `model ↔ ui`)는 협력이라 위반이 아니다.

### 3. entities의 상위 레이어 침범

- `entities`가 `features`·`widgets`·`_pages`를 import하지 않는지 본다.
- `ProductCard` 같은 표현이 담기·찜 `feature`를 직접 import하면 역방향이다. 표현+행위 조합은 widget/page에 있어야 한다.

### 4. shared의 비즈니스 로직 포함

- `shared`가 도메인을 알지 않는지 본다. 특정 화면 문구, 상품·장바구니 같은 도메인 개념, 회원 등급·통화 정책이 `shared`에 있으면 승격 대상이다.
- 반례 구분: 순수 포맷·fetch 전송·headless 로직·compound UI는 도메인 무지라 `shared`가 맞다.

### 5. Public API 우회

- 슬라이스에 `index.ts`(Public API)가 있는데 외부가 내부 파일을 deep import해 계약을 우회하지 않는지 본다.
- barrel(습관적 `export *`)과 Public API(숨김 의도가 있는 계약)를 구분한다. 단일 유틸에 굳이 만든 빈 barrel도 지적한다.

### 6. 레이어·세그먼트 남용

- 빈 폴더·미사용 `index.ts`·불필요한 레이어가 없는지 본다(안 만드는 것도 설계).
- 세그먼트가 목적(`ui/model/api/lib`)을 드러내는지, `shared/lib`이 이름 없는 유틸 창고가 되지 않았는지 본다.

### 7. feature vs 단일 페이지 로직

- 재사용되거나 독립 능력(검색·담기처럼 여러 곳에서 쓰는 사용자 행위)인 것만 `feature`로 둔다.
- **한 페이지에서만 쓰는 로직(그 페이지 전용 조회·상태 등)은 `feature`로 나누지 않고 해당 `_pages/<page>`에 co-locate했는지 본다.** 재사용 없는 것을 억지로 feature로 올렸으면 불필요한 슬라이스이고, 필요 없는 feature를 만들지 않는 것도 설계다.
- 반대로 여러 곳이 쓰는 재사용 능력을 특정 page 안에 가두지 않았는지도 본다.

### 8. App Router 경계

- `src/app/**`의 `page.tsx`·`layout.tsx`가 **얇은 진입점**인지 본다. 데이터 조회·비즈니스 로직이 새어들었으면 `_pages`(또는 하위)로 내려야 한다.
- `src/app/api`(mock 백엔드)가 프론트 레이어(`_pages`·`widgets`·`features`)를 import하지 않는지 본다. 경계는 HTTP다. 단, 공유 계약 타입을 `entities`에서 아래로 가져오는 것은 허용된다.
- 프론트가 `app/api`를 직접 import하지 않고 fetch 계층(`shared/api`)을 통하는지 본다.

## 출력

- 레이어 매핑을 먼저 제시하고, 렌즈별로 `통과 / 위반`을 판정한다.
- 위반은 **심각도 순**으로 낸다: 순환 의존 > 역방향 import > 같은 레이어 슬라이스 직접 import > entities 상위 침범 > shared 비즈니스 > Public API 우회 > 네이밍·남용.
- **기계로 확인되는 위반**(방향·순환·슬라이스·상대경로 — grep으로 증명)과 **판단이 필요한 위반**(shared 비즈니스인가·feature인가 page인가)을 구분해 표시하고, 후자는 근거와 확신도를 밝힌다.
- 위반은 `파일:위치 · 어긴 규칙 · 왜 경계 위반인가`. **코드 수정안·리팩터 diff는 쓰지 않는다.** 올바른 위치를 판단으로 제시하는 것까지만 한다.
- 판정이 애매하면 후보와 트레이드오프를 제시하고 선택을 넘긴다.
- 과잉(불필요한 레이어·성급한 슬라이스·빈 barrel)도 함께 지적한다. 무조건 더 나누라고 하지 않는다.
