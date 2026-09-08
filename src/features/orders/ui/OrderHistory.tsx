"use client";

import { useOrders } from "@/features/orders/api/queries";

import styles from "./OrderHistory.module.css";

export function OrderHistory() {
  const orders = useOrders();

  // 보여줄 데이터가 없을 때만 로딩·에러가 화면을 차지한다. 이미 목록이 있으면(배경 재조회 실패)
  // 그대로 두고 아래에서 인라인으로 알린다 — queryClient의 "멀쩡한 화면을 덮지 않는다"와 같은 기준.
  if (orders.data === undefined) {
    if (orders.isError) {
      return (
        <p role="alert" className={styles.message}>
          {orders.error?.message}{" "}
          <button type="button" onClick={() => orders.refetch()} disabled={orders.isFetching}>
            다시 시도
          </button>
        </p>
      );
    }
    return <p className={styles.message}>주문 내역을 불러오는 중…</p>;
  }
  if (orders.data.length === 0) {
    // 주문 직후 무효화로 재조회 중이면 아직 stale 빈 배열이라, "없음" 대신 로딩을 보여 깜빡임을 막는다.
    if (orders.isFetching) {
      return <p className={styles.message}>주문 내역을 불러오는 중…</p>;
    }
    return <p className={styles.message}>주문 내역이 없습니다.</p>;
  }

  return (
    <>
      {/* 보이던 목록은 두고 실패를 알리며 바로 다시 시도할 수 있게 한다 — ProductListResults와 같은 모양. */}
      {orders.isError && (
        <p role="alert" className={styles.message}>
          주문 내역을 새로 불러오지 못했습니다.{" "}
          <button type="button" onClick={() => orders.refetch()} disabled={orders.isFetching}>
            다시 시도
          </button>
        </p>
      )}
      <ul className={styles.list}>
        {orders.data.map((order) => (
          <li key={order.id} className={styles.order}>
            <div className={styles.head}>
              <span className={styles.id}>{order.id}</span>
              <time dateTime={order.createdAt} className={styles.date}>
                {new Date(order.createdAt).toLocaleString("ko-KR")}
              </time>
            </div>
            <ul className={styles.items}>
              {order.items.map((item) => (
                <li key={item.productId}>
                  {item.productId} × {item.quantity}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}
