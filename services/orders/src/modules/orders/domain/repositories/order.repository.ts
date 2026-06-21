import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { OrderStatus } from "../models/order-status";

export const ORDER_REPOSITORY = Symbol("ORDER_REPOSITORY");

export interface OrderRow {
  id: string;
  userId: string;
  customerEmail: string;
  customerName: string;
  canteenId: string;
  status: OrderStatus;
  total: string;
  paymentMethodId: string;
  paymentMethodNameSnapshot: string;
  paymentMethodType: string;
  rating: number | null;
  ratingComment: string | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemRow[];
}

export interface OrderItemRow {
  id: string;
  productId: string;
  productNameSnapshot: string;
  unitPriceAtPurchase: string;
  quantity: number;
  note: string | null;
  extras: {
    extraId: string;
    extraNameSnapshot: string;
    unitPriceAtPurchase: string;
  }[];
}

export interface OrderRepository {
  create(data: {
    userId: string;
    customerEmail: string;
    customerName: string;
    canteenId: string;
    total: string;
    paymentMethodId: string;
    paymentMethodNameSnapshot: string;
    paymentMethodType: string;
    items: {
      productId: string;
      productNameSnapshot: string;
      unitPriceAtPurchase: string;
      quantity: number;
      note: string | null;
      extras: {
        extraId: string;
        extraNameSnapshot: string;
        unitPriceAtPurchase: string;
      }[];
    }[];
  }): Promise<OrderRow>;

  findById(id: string): Promise<OrderRow | null>;

  updateStatus(id: string, status: OrderStatus, cancelReason?: string): Promise<void>;

  setRating(id: string, rating: number, comment?: string | null): Promise<void>;

  findByUser(
    userId: string,
    terminal: boolean,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<OrderRow>>;

  findByCanteen(
    canteenId: string,
    statuses: OrderStatus[],
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<OrderRow>>;
}
