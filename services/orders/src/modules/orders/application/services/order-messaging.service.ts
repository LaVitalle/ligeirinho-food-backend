import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import {
  OrdersExchangeName,
  OrdersRoutingKey,
  type OrderCreatedPayload,
  type OrderStatusChangedPayload,
} from "@shared/contracts/events/orders-events.enum";
import { SharedMessagingService } from "@shared/infra/messaging/shared-messaging.service";

/**
 * Publica os eventos de pedidos consumidos pelo identity-service:
 * - order.created -> e-mail de confirmação ao cliente
 * - order.status_changed -> notificação de mudança de status ao cliente
 */
@Injectable()
export class OrderMessagingService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OrderMessagingService.name);

  constructor(private readonly messaging: SharedMessagingService) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.messaging.assertExchange(OrdersExchangeName.ORDER_CREATED);
      await this.messaging.assertExchange(
        OrdersExchangeName.ORDER_STATUS_CHANGED,
      );
    } catch (error) {
      this.logger.error(
        "Falha ao declarar exchanges de pedidos",
        error as Error,
      );
    }
  }

  async publishOrderCreated(payload: OrderCreatedPayload): Promise<void> {
    await this.messaging.publish(
      OrdersExchangeName.ORDER_CREATED,
      OrdersRoutingKey.ORDER_CREATED,
      payload,
    );
  }

  async publishOrderStatusChanged(
    payload: OrderStatusChangedPayload,
  ): Promise<void> {
    await this.messaging.publish(
      OrdersExchangeName.ORDER_STATUS_CHANGED,
      OrdersRoutingKey.ORDER_STATUS_CHANGED,
      payload,
    );
  }
}
