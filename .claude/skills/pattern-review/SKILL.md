---
name: pattern-review
description: 컴포넌트 패턴(Headless·Compound)과 controlled/uncontrolled API, FSD 배치가 올바른지 리뷰합니다. "패턴 리뷰해줘", "compound 맞게 짰는지 봐줘", "이중 API 봐줘", "이 훅 headless로 잘 나뉘었어?", "/pattern-review" 라고 하면 이 skill이 활성화됩니다.
allowed-tools: Read, Grep, Glob
argument-hint: [파일경로 또는 컴포넌트명]
---

# Pattern Review — Headless · Compound · 이중 API · FSD 배치

컴포넌트가 **어떤 패턴을 택했는지**, 그 패턴의 계약을 지켰는지, FSD 레이어에 맞게 놓였는지를 리뷰한다.
(관심사 분리·Custom Hook 책임은 `component-review`가 본다 — 여기선 패턴과 배치만.)

---

## 리뷰 실행 순서

1. **대상 읽기** — 인자로 받은 파일(없으면 대상을 묻는다)과 연관 파일(Context·types·훅·조립부)을 함께 읽는다. compound는 조각 파일이 흩어져 있으니 조립 지점(`Object.assign`/`Xxx.Trigger`)까지 본다.
2. **패턴 판별** — 아래 *패턴 판별 기준*으로 Headless / Compound / 단순 컴포넌트 중 무엇인지 정한다. 패턴을 잘못 고른 것 자체가 첫 리뷰 포인트.
3. **계약 점검** — 판별된 패턴의 체크리스트를 적용한다.
4. **FSD 배치 점검** — 파일이 맞는 레이어·segment에 있는지, import가 아래로만 흐르는지 본다.
5. **리포트 출력** — _리포트 형식_ 그대로. 파일은 수정하지 않고 후보만 제안한다.

---

## 패턴 판별 기준

| 패턴                      | 언제                                               | 신호                                                        |
| ------------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| **Headless(prop-getter)** | 동작(키보드·포커스·aria)은 같고 생김새만 여럿일 때 | 로직 훅 + `getXxxProps()`로 뷰에 내림, 뷰는 `data-*`만 읽음 |
| **Compound**              | 내부 구성이 호출처마다 달라 자유 조합이 필요할 때  | Context + `Root.Part` 조각들, 부모가 배치를 호출자에 위임   |
| **단순 컴포넌트**         | 구성·동작이 고정일 때                              | props로 충분, 위 둘은 과설계                                |

- **성급한 패턴화 금지.** 변형이 1개뿐인데 Headless/Compound를 두르지 않았는가? 조합 자유도가 없으면 단순 컴포넌트가 맞다.

---

## 체크리스트

### 1. Headless

- [ ] 로직(키보드·포커스·타입어헤드·outside-click·aria)이 훅에 있고, 뷰엔 `getXxxProps()`로만 내려가는가?
- [ ] 뷰가 내부 상태를 직접 계산하지 않고 훅이 실어 보낸 `data-*`/`aria-*`만 읽는가?
- [ ] 같은 훅 위에 뷰가 2개 이상 얹히는가? 하나뿐이면 headless가 과설계 아닌가?
- [ ] 여러 인스턴스가 공존해도 id(`useId`)·상태가 충돌하지 않는가?

### 2. Compound

- [ ] 조각(`Trigger`/`Panel`/`Title`…)이 Context로 상태를 공유하고, 부모가 배치를 호출자에 위임하는가?
- [ ] Context value가 `useMemo`로 안정화됐는가? (매 렌더 새 객체면 하위 전체 리렌더)
- [ ] 조각을 Root 밖에서 쓰면 명확히 실패하는가? (Context null 가드)

### 3. controlled / uncontrolled 이중 API

- [ ] 제어 여부를 **prop 유무**(`open !== undefined`)로 판별하는가? (별도 `isControlled` prop을 받지 않음)
- [ ] uncontrolled일 때만 내부 state를 갱신하고, controlled일 땐 부모 값을 그대로 읽는가?
- [ ] 상태 통보 창구가 `onXxxChange` **하나**인가? (`onClose`·`onOpen`을 따로 두어 창구가 갈리지 않음)
- [ ] 콜백 prop 이름이 `on~`인가?

### 4. 오버레이(Portal/scroll/effect)

- [ ] Portal로 DOM 최상단에 렌더돼 부모 `overflow`/`z-index`에 안 갇히는가?
- [ ] Esc·오버레이 클릭으로 닫히고, 그 처리도 `onOpenChange` 하나로 모이는가?
- [ ] **스크롤 잠금과 Esc 리스너가 서로 다른 effect로 분리**됐는가? (합치면 `setOpen` 정체성 변화로 잠금이 재실행돼 원복값이 오염됨)
- [ ] 동작을 끄는 지점을 이름으로 열어뒀는가? (`lockScroll` ✅ / `modal` 같은 모호한 이름 ❌)

### 5. 확장 지점

- [ ] `className` 병합(`cn`)이나 `ComponentPropsWithoutRef`로 HTML 속성을 위임해 확장을 열었는가?
- [ ] 변형 로직을 내부에 쌓지 않고 콜백·render prop으로 호출자에 위임했는가?

---

## FSD 배치 점검

- [ ] JSX 없는 헤드리스 훅·순수 유틸이 `ui`가 아니라 `shared/lib`에 있는가?
- [ ] 도메인 타입이 `model`에, 재사용 프리미티브가 `shared/ui`에 있는가?
- [ ] compound 내부용 types·Context가 그 컴포넌트 폴더에 콜로케이트됐는가? (내부 계약이라 `lib`로 안 뺌)
- [ ] import가 아래로만(`app→views→features→shared`) 흐르고 역참조·순환이 없는가?
- [ ] 참조가 전부 절대경로(`@/`)인가? (`*.module.css`만 예외)

---

## 리포트 형식

**1) 패턴 판별** — 택한 패턴 / 적절한지 / 과·과소 설계 여부

**2) 위반 지점 + 심각도**

- 🔴 높음 — 패턴 오선택(변형 1개인데 compound), 이중 API 창구 분열(`onClose`+`onOpenChange`), Context value 미안정화, FSD 역참조
- 🟡 중간 — 뷰가 상태를 직접 계산(headless 누수), effect 미분리, `on~` 네이밍 위반, 배치 오류(훅이 `ui`에)
- 🟢 사소 — 확장 지점 미개방, 이름 다듬기

각 항목: `[심각도] 파일:라인 — 무엇이 / 왜 문제 / 어떻게`

**3) 개선 후보 표**

| 후보 | 위치(라인) | 무엇을 | 이점 | 안 고쳐도 되는 이유 |
| ---- | ---------- | ------ | ---- | ------------------- |

**4) 이 레포의 표준 배치(FSD)**

```
app/       ← 라우팅만
views/     ← 화면 조합
features/  ← 도메인 slice (ui / model / api)
shared/    ← 재사용 (ui = 프리미티브, lib = 로직·유틸). slice 없이 segment 직접.
```

import은 아래로만, 참조는 절대경로(`@/`). (구조의 상세·왜는 `CONVENTION.md` 폴더 구조 규칙.)
