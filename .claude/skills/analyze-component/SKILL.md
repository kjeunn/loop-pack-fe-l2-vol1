---
name: analyze-component
description: React 컴포넌트·훅·공통 UI를 디자인 패턴 관점으로 분석한다. 우리 코드 설계 리뷰와 외부 라이브러리(패키지) 소스 학습 모두에 쓴다. 공개 API, 패턴 선택(Headless·Compound·Controlled/Uncontrolled·Provider vs Singleton·Portal·slot/render prop 등), 상태 소유권, 리렌더 경로, 책임 범위, 사용처 코드 단순성을 점검한다.
allowed-tools: Read, Grep, Glob
argument-hint: [파일·컴포넌트·라이브러리 소스]
---

# analyze-component — 컴포넌트 패턴 분석

"무슨 패턴인가"를 맞히는 게 아니라 **그 패턴 덕분에 사용처 코드가 더 단순해졌는가**를 판단한다.
우리 공통 컴포넌트 리뷰와 외부 라이브러리 학습(왜 이렇게 짰나·무엇을 빌릴까) 모두에 쓴다.

## 절차

1. **공개 API를 먼저 적는다** — props, children/slot, compound child, controlled prop, callback, imperative(ref) 핸들.
2. **상태 소유권 분류** — 서버 / 클라이언트 / 파생값 / 외부 store. 단일 출처가 어디인가.
3. **패턴 매핑** — 아래 가이드로 실제 요구와 패턴이 맞는지 본다.
4. **리렌더 경로 추적** — 어떤 상태 변경이 어느 subtree를 다시 그리는가.
5. **사용처 단순성 판단** — 사용 예시(call site/story/test)로 전보다 단순해졌는지. 없으면 "판단 보류".
6. **대안 비교 + 심각도 보고** — 더 단순한 대안이 있으면 함께. 문제는 blocker/major/minor로.

## 패턴 선택 가이드

| 상황                        | 패턴                           | 핵심 질문                                   |
| --------------------------- | ------------------------------ | ------------------------------------------- |
| 동작은 같고 UI만 다양       | Headless(prop-getter)          | 로직/DOM 분리로 사용처가 쉬워지나           |
| 사용처가 내부 구조를 조합   | Compound                       | 부모-자식·공유 상태가 API에 자연히 드러나나 |
| open/value를 안팎에서 다룸  | Controlled/Uncontrolled        | 단일 출처가 명확한가                        |
| 어디서든 호출(toast 등)     | Provider vs Singleton          | 트리 스코프가 필요한가, 비-React서도 부르나 |
| 부모 overflow/z-index 탈출  | Portal                         | 렌더 위치와 상태 소유를 혼동 안 했나        |
| 고정 위치 삽입 vs 렌더 위임 | slot(ReactNode) vs render prop | 위치만 주나, 상태까지 넘겨 렌더를 맡기나    |
| props 3개 이하 단순 표시    | 패턴 없음                      | 패턴이 오히려 복잡하게 만들지 않나          |

## 리뷰 관점

- **패턴 적합성** — 선택 이유가 실제 변경 가능성과 연결되나. Headless는 UI 다양성 있을 때만, Compound는 구조 자유도 필요할 때만.
- **책임 범위** — 컴포넌트/훅/store/service를 각각 한 문장으로. "그리고"가 많으면 분리 후보.
- **상태 소유권** — controlled면 외부, 아니면 내부를 단일 출처로. default\*는 초기값만, 파생값을 state로 복제 안 함.
- **리렌더 경로** — context value·callback·파생 객체가 매 렌더 새로 생겨 전파를 넓히지 않나. 외부 store는 useSyncExternalStore로 잇나.
- **API·합성 경계** — boolean 조합으로 불가능 상태가 나면 union/variant. compound child가 부모 밖이면 에러가 명확한가.
- **사용처 단순성** — 사용처가 알아야 할 상태·이벤트·DOM이 줄었나. 1곳뿐이면 추상화 비용이 이득보다 큰지.

## 결과 형식

- **요약**: 공개 API·선택 패턴 2-3줄
- **표**: 패턴 매핑 / 사용처 단순성 / 리렌더 경로 / 대안 비교
- **지적**: [blocker|major|minor] 파일:줄 — 문제 → 제안
- **유지할 선택 / 질문**

## 판정 기준

- blocker: 상태 소유권 충돌·잘못된 controlled·Portal/store 동작 버그
- major: 패턴/책임 경계 불일치로 확장 비용 증가
- minor: 이름·props·리렌더 범위·에러 메시지 다듬기
