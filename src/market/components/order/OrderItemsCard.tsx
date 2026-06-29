import { Card } from "@/market/card";
import type { CartItem } from "@/market/types";

import { OrderItemRow } from "./OrderItemRow";

interface OrderItemsCardProps {
  items: CartItem[];
}

export function OrderItemsCard({ items }: OrderItemsCardProps) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>주문 상품</Card.Title>
      </Card.Header>
      <Card.Body>
        {items.map((it) => (
          <OrderItemRow
            key={it.id}
            thumbnail={it.thumbnail}
            name={it.name}
            option={it.option}
            quantity={it.quantity}
            amount={it.price * it.quantity}
          />
        ))}
      </Card.Body>
    </Card>
  );
}
