/**
 * Eventos publicados pelo orders-service.
 */
export enum OrdersExchangeName {
  ORDER_CREATED = "orders.orders.created.exchange",
  ORDER_STATUS_CHANGED = "orders.orders.status-changed.exchange",
}

export enum OrdersRoutingKey {
  ORDER_CREATED = "order.created",
  ORDER_STATUS_CHANGED = "order.status_changed",
}

/** Payload de order.created — identity envia e-mail de confirmação. */
export interface OrderCreatedPayload {
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  canteenId: string;
  canteenName: string;
  total: string;
}

/** Payload de order.status_changed — identity notifica o cliente. */
export interface OrderStatusChangedPayload {
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  status: string;
}
