import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import {
  IdentityExchangeName,
  IdentityRoutingKey,
  type SellerCreatedPayload,
} from "@shared/contracts/events/identity-events.enum";
import { SharedMessagingService } from "@shared/infra/messaging/shared-messaging.service";

/**
 * Publica o evento seller.created — consumido pelo catalog-service para
 * vincular o SELLER recém-criado à cantina (canteen.seller_id).
 */
@Injectable()
export class SellerMessagingService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SellerMessagingService.name);

  constructor(private readonly messaging: SharedMessagingService) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.messaging.assertExchange(IdentityExchangeName.SELLER_CREATED);
    } catch (error) {
      this.logger.error(
        "Falha ao declarar exchange seller.created",
        error as Error,
      );
    }
  }

  async publishSellerCreated(payload: SellerCreatedPayload): Promise<void> {
    await this.messaging.publish(
      IdentityExchangeName.SELLER_CREATED,
      IdentityRoutingKey.SELLER_CREATED,
      payload,
    );
  }
}
