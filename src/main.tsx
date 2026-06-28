import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import { installMockApi } from "./productList/_mockApi.ts";

import "./index.css";

// 임시 mock — `/api/products` 응답을 흉내낸다. week-03 과제 중에는 건드리지 않습니다.
installMockApi();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
