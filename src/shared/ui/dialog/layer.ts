// Dialog 전역 자원(배경 스크롤·Esc)을 "인스턴스"가 아니라 "열린 Dialog 전체" 기준으로 관리한다.
// body 스크롤과 document keydown은 페이지에 하나뿐인 자원이다.
// 여러 Dialog가 겹쳐 열리면 소유·해제를 한 곳에서 세야 한다.
// 안 그러면 안쪽을 닫을 때 스크롤이 풀리거나, Esc 한 번에 둘 다 닫힌다.
// document별로 분리(WeakMap)해 페이지와 iframe이 서로 간섭하지 않게 한다.

interface LayerState {
  scrollCount: number;
  prevOverflow: string;
  escStack: Array<() => void>;
  onKeyDown: (event: KeyboardEvent) => void;
}

const states = new WeakMap<Document, LayerState>();

function getState(doc: Document): LayerState {
  const existing = states.get(doc);
  if (existing) return existing;
  const state: LayerState = {
    scrollCount: 0,
    prevOverflow: "",
    escStack: [],
    // Esc는 stack 맨 위(가장 최근 열린) Dialog 하나만 닫는다.
    onKeyDown: (event) => {
      if (event.key !== "Escape") return;
      const top = state.escStack[state.escStack.length - 1];
      if (top) top();
    },
  };
  states.set(doc, state);
  return state;
}

// 배경 스크롤 잠금 — 첫 Dialog에서만 잠그고, 마지막이 닫혀 count가 0이 될 때만 원복(refcount).
export function lockScroll(doc: Document): () => void {
  const state = getState(doc);
  if (state.scrollCount === 0) {
    state.prevOverflow = doc.body.style.overflow;
    doc.body.style.overflow = "hidden";
  }
  state.scrollCount += 1;
  return () => {
    state.scrollCount -= 1;
    if (state.scrollCount === 0) doc.body.style.overflow = state.prevOverflow;
  };
}

// Esc 닫기 — 열린 Dialog의 close를 stack에 쌓는다.
// keydown 리스너는 document당 하나만 유지한다.
export function pushEscClose(doc: Document, close: () => void): () => void {
  const state = getState(doc);
  if (state.escStack.length === 0) doc.addEventListener("keydown", state.onKeyDown);
  state.escStack.push(close);
  return () => {
    const index = state.escStack.lastIndexOf(close);
    if (index >= 0) state.escStack.splice(index, 1);
    if (state.escStack.length === 0) doc.removeEventListener("keydown", state.onKeyDown);
  };
}
