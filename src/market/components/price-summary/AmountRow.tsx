import { Price } from "@/market/Price";

interface AmountRowProps {
  label: string;
  amount: number;
  isDiscount?: boolean;
  caption?: string; // 라벨 아래 보조 설명(쿠폰 코드 등)
}

export function AmountRow({ label, amount, isDiscount = false, caption }: AmountRowProps) {
  return (
    <div className="line">
      <div className="grow">
        <span>{label}</span>
        {caption ? <small>{caption}</small> : null}
      </div>
      {isDiscount ? (
        <span style={{ color: "#ef4444" }}>
          - <Price amount={amount} />
        </span>
      ) : (
        <Price amount={amount} />
      )}
    </div>
  );
}
