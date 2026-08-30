"use client";

import { useOrders } from "@/features/orders/api/queries";

export function OrderHistory() {
  const orders = useOrders();

  if (orders.isPending) {
    return <p>주문 내역을 불러오는 중…</p>;
  }
  if (orders.isError) {
    return <p role="alert">{orders.error?.message}</p>;
  }
  if (orders.data.length === 0) {
    return <p>주문 내역이 없습니다.</p>;
  }

  return (
    <ul>
      {orders.data.map((order) => (
        <li key={order.id}>
          <span>{order.id}</span>{" "}
          <time dateTime={order.createdAt}>
            {new Date(order.createdAt).toLocaleString("ko-KR")}
          </time>
          <ul>
            {order.items.map((item) => (
              <li key={item.productId}>
                {item.productId} × {item.quantity}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
