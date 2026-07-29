import { useEffect } from "react";

import { useCommerceStore } from "@/entities/commerce/model/commerceStore";

// store가 skipHydration이라 저장값이 자동 복원되지 않는다.
// 마운트 뒤에 한 번 복원해, 서버·클라이언트의 첫 렌더가 빈 상태로 일치한 다음에만 값을 채운다.
export function useHydrateCommerce() {
  useEffect(() => {
    void useCommerceStore.persist.rehydrate();
  }, []);
}
