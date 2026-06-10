import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import {
  CatalogExchangeName,
  CatalogRoutingKey,
  type CanteenCreatedPayload,
  type CanteenProjectionPayload,
} from "@shared/contracts/events/catalog-events.enum";
import { SharedMessagingService } from "@shared/infra/messaging/shared-messaging.service";

/**
 * Publica os eventos de cantina:
 * - canteen.created — dispara a criação do SELLER no identity-service.
 * - canteen.updated — projeção de cantina no orders-service.
 * - canteen.deleted — projeção de cantina no orders-service.
 */
@Injectable()
export class CanteenMessagingService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CanteenMessagingService.name);

  constructor(private readonly messaging: SharedMessagingService) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.messaging.assertExchange(CatalogExchangeName.CANTEEN_CREATED);
      await this.messaging.assertExchange(CatalogExchangeName.CANTEEN_UPDATED);
      await this.messaging.assertExchange(CatalogExchangeName.CANTEEN_DELETED);
    } catch (error) {
      this.logger.error(
        "Falha ao declarar exchanges de cantina",
        error as Error,
      );
    }
  }

  async publishCanteenCreated(payload: CanteenCreatedPayload): Promise<void> {
    await this.messaging.publish(
      CatalogExchangeName.CANTEEN_CREATED,
      CatalogRoutingKey.CANTEEN_CREATED,
      payload,
    );
  }

  async publishCanteenUpserted(payload: CanteenProjectionPayload): Promise<void> {
    await this.messaging.publish(
      CatalogExchangeName.CANTEEN_UPDATED,
      CatalogRoutingKey.CANTEEN_UPDATED,
      payload,
    );
  }

  async publishCanteenDeleted(payload: CanteenProjectionPayload): Promise<void> {
    await this.messaging.publish(
      CatalogExchangeName.CANTEEN_DELETED,
      CatalogRoutingKey.CANTEEN_DELETED,
      payload,
    );
  }
}
