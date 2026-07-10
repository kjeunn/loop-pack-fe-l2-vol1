# CONVENTION.md

> 프로젝트 구조·컨벤션과 그 "왜"를 사람이 파악하기 위한 문서.
> AI 코드 생성 규칙(요약)은 `CLAUDE.md` 참고.

---

## 📁 폴더 구조 규칙 (FSD)

레이어로 나눠 **변경 파급을 가둔다** — 위 레이어만 아래를 알고, 아래는 위를 모른다.

- **레이어.** `app`(라우팅) → `views`(화면 조합) → `features`(도메인 단위) → `shared`(재사용 프리미티브·유틸). import는 **아래로만** 흐른다. 역참조·순환은 곧 경계가 깨졌다는 신호.
- **레이어 안은 segment로.** `ui`(컴포넌트) / `model`(타입·상태) / `api`(데이터 접근) / `lib`(로직·유틸). 도메인 타입은 `model`에, JSX 없는 헤드리스 훅은 `lib`에. `shared`는 slice 없이 segment를 바로 둔다.
- **폴더는 kebab-case, 파일은 PascalCase**(컴포넌트명). 폴더를 소문자로 통일하면 OS 간 대소문자 충돌(Linux CI에서만 터지는 버그)을 막는다. CSS 모듈도 `Xxx.module.css`로 1:1.
- **import는 절대경로(`@/`).** 슬라이스를 옮겨도 참조가 안 깨진다. 콜로케이트 에셋(`*.module.css`)만 상대경로 예외.

## 🎨 CSS 전략

- **Tailwind 우선.** 레이아웃·간격·색·상태 변형(`data-[highlighted]`, `aria-expanded`)은 유틸리티로 표현한다.
- **CSS Module은 Tailwind가 못 쓰는 것만.** `@keyframes`(shimmer 등)처럼 유틸리티로 안 되는 것만 `*.module.css`에 두고 컴포넌트에 콜로케이트한다. 클래스·키프레임명이 자동 스코프돼 충돌이 없다.
- **모듈 클래스명은 camelCase.** 여러 단어 클래스는 하이픈(`addr-summary`)이면 점 표기로 못 읽으므로(`styles.addr-summary` → 뺄셈으로 해석) `addrSummary`로 둔다.

## ✍️ 네이밍이 이런 이유

- **`on~`(콜백 prop) / `handle~`(핸들러).** 방향을 드러내기 위함. `on~`은 자식→부모로 올라가는 이벤트 선언, `handle~`은 그 처리 구현.
- **props 타입을 `컴포넌트명+Props`로 분리.** 시그니처가 짧아지고 검색·재사용이 쉽다.
- **의미 기반 네이밍.** 구현이 바뀌어도 이름이 어긋나지 않게(`section`이 아니라 `card`).

## 🧩 컴포넌트 패턴

- **상태 소유권.** "이 값을 누가 읽는가"로 위치를 정한다. 입력 중 임시값은 자식이, 여러 곳이 읽는 결과값은 공통 부모가 소유. (상세 규칙은 `CLAUDE.md`)
- **Compound + 이중 API(Dialog).** `Dialog.Trigger/Overlay/Panel/...`을 Context로 조립한다. 머리말·버튼 구성이 호출처마다 달라 조각 배치를 호출자에게 위임하기 때문. 열림 상태는 `open` prop 유무로 controlled/uncontrolled를 한 컴포넌트에서 판별하고, 통보는 `onOpenChange` 하나로 모은다 — 창구가 둘(`onClose`+`onOpenChange`)이면 동기화가 어긋난다. 스크롤 잠금과 Esc 이펙트는 분리한다: `setOpen` 정체성이 바뀌어 잠금 이펙트가 재실행되면 원복값이 오염된다.
- **Headless prop-getter(Select).** 키보드·포커스·타입어헤드·aria를 `useSelect` 훅에 몰고 `getToggleButtonProps`/`getMenuProps`/`getItemProps`로 내린다. 뷰는 훅이 실어 보낸 `data-*`만 읽어 스타일링 → 같은 로직 위에 생김새가 다른 여러 뷰(Size/Text/Thumbnail)를 얹는다.
