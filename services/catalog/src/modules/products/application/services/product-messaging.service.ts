import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import {
  CatalogExchangeName,
  CatalogRoutingKey,
  type ProductProjectionPayload,
} from "@shared/contracts/events/catalog-events.enum";
import { SharedMessagingService } from "@shared/infra/messaging/shared-messaging.service";

/**
 * Publica os eventos de produto:
 * - product.upserted — projeção de produto no orders-service (create/update).
 * - product.deleted — projeção de produto no orders-service (soft delete).
 */
@Injectable()
export class ProductMessagingService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProductMessagingService.name);

  constructor(private readonly messaging: SharedMessagingService) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.messaging.assertExchange(CatalogExchangeName.PRODUCT_UPSERTED);
      await this.messaging.assertExchange(CatalogExchangeName.PRODUCT_DELETED);
    } catch (error) {
      this.logger.error(
        "Falha ao declarar exchanges de produto",
        error as Error,
      );
    }
  }

  async publishProductUpserted(payload: ProductProjectionPayload): Promise<void> {
    await this.messaging.publish(
      CatalogExchangeName.PRODUCT_UPSERTED,
      CatalogRoutingKey.PRODUCT_UPSERTED,
      payload,
    );
  }

  async publishProductDeleted(payload: ProductProjectionPayload): Promise<void> {
    await this.messaging.publish(
      CatalogExchangeName.PRODUCT_DELETED,
      CatalogRoutingKey.PRODUCT_DELETED,
      payload,
    );
  }
}
