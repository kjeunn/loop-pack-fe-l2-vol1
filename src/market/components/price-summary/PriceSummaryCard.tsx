import { Card } from "@/market/card";
import { Price } from "@/market/Price";

import { AmountRow } from "./AmountRow";
import styles from "./PriceSummaryCard.module.css";

interface PriceSummary {
  itemTotal: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
  finalPrice: number;
  couponCode?: string; // 쿠폰 할인 줄 표시 여부 + 라벨용
  pointApplied: boolean; // 적립금 줄 표시 여부
}

interface PriceSummaryCardProps {
  summary: PriceSummary;
}

export function PriceSummaryCard({ summary }: PriceSummaryCardProps) {
  const {
    itemTotal,
    shippingFee,
    couponDiscount,
    pointDiscount,
    finalPrice,
    couponCode,
    pointApplied,
  } = summary;

  return (
    <Card>
      <Card.Header>
        <Card.Title>결제 금액</Card.Title>
      </Card.Header>
      <Card.Body>
        <AmountRow label="상품 금액" amount={itemTotal} />
        <AmountRow label="배송비" amount={shippingFee} />
        {couponCode ? (
          <AmountRow label="쿠폰 할인" amount={couponDiscount} isDiscount caption={couponCode} />
        ) : null}
        {pointApplied ? <AmountRow label="적립금 사용" amount={pointDiscount} isDiscount /> : null}
        <div className={styles.total}>
          <span>최종 결제 금액</span>
          <Price amount={finalPrice} />
        </div>
      </Card.Body>
    </Card>
  );
}
