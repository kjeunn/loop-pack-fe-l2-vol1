import type { CategoryId, ProductSort } from "@/entities/product/model/types";

export type ProductListQuery = {
  q?: string;
  category?: CategoryId | "all";
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};
