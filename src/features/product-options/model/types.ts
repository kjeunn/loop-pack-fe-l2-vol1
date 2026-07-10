// 상품 옵션의 도메인 타입. ui(Select 변형)와 api(데이터)가 함께 쓴다.
// 재고는 stock 수량으로 두고 "품절"은 프론트가 stock<=0으로 파생한다.

export interface TextOption {
  id: string;
  title: string;
  price: number;
  unitPrice: number;
  freeShipping?: boolean;
  stock: number;
}

export interface SizeOption {
  id: string;
  size: number;
  stock: number;
  deliveryText?: string;
}

export interface ThumbnailOption {
  id: string;
  title: string;
  image: string;
  discountRate: number;
  price: number;
  sameDayDelivery?: boolean;
  stock: number;
}
