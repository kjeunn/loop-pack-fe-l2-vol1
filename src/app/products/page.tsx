import { ProductListView } from "@/views/products/ProductListView";

// app은 라우팅만. 화면 조합은 views가 소유한다.
export default function ProductList() {
  return <ProductListView />;
}
