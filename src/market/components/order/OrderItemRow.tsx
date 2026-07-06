import { Price } from "@/market/Price";

interface OrderItemRowProps {
  thumbnail: string;
  name: string;
  option: string;
  quantity: number;
  amount: number;
}

export function OrderItemRow({ thumbnail, name, option, quantity, amount }: OrderItemRowProps) {
  return (
    <div className="line">
      <span className="thumb">{thumbnail}</span>
      <div className="grow">
        <span>{name}</span>
        <small>
          {option} · 수량 {quantity}
        </small>
      </div>
      <Price amount={amount} />
    </div>
  );
}
