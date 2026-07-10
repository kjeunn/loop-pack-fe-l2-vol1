import { DemoView } from "@/views/demo/DemoView";

// app은 라우팅만. 화면 조합은 views가 소유한다.
export default function Home() {
  return <DemoView />;
}
