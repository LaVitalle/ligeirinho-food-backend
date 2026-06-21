import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import type { Channel, ConsumeMessage } from "amqplib";
import {
  IdentityExchangeName,
  IdentityRoutingKey,
  type SellerCreatedPayload,
} from "@shared/contracts/events/identity-events.enum";
import { RabbitMQService } from "@shared/infra/messaging/rabbitmq.service";
import {
  CANTEEN_REPOSITORY,
  CanteenRepository,
} from "../../domain/repositories/canteen.repository";

const EXCHANGE_TYPE = "direct";
const QUEUE = "catalog.identity-sellers.created.queue";

/**
 * Consome seller.created (publicado pelo identity) e vincula o SELLER recém-criado
 * à cantina, preenchendo canteen.seller_id (consistência eventual).
 */
@Injectable()
export class SellerMessageConsumerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(SellerMessageConsumerService.name);
  private channel?: Channel;

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    @Inject(CANTEEN_REPOSITORY)
    private readonly canteenRepository: CanteenRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      this.channel = await this.rabbitMQService.createChannel();
      await this.channel.assertExchange(
        IdentityExchangeName.SELLER_CREATED,
        EXCHANGE_TYPE,
        { durable: true },
      );
      await this.channel.assertQueue(QUEUE, { durable: true });
      await this.channel.bindQueue(
        QUEUE,
        IdentityExchangeName.SELLER_CREATED,
        IdentityRoutingKey.SELLER_CREATED,
      );
      await this.channel.consume(QUEUE, (msg) => void this.handle(msg));
      this.logger.log(`Consumindo fila "${QUEUE}"`);
    } catch (error) {
      this.logger.error(
        "Falha ao iniciar consumidor de seller.created",
        error as Error,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
  }

  private async handle(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) return;
    try {
      const payload = JSON.parse(
        msg.content.toString(),
      ) as SellerCreatedPayload;
      await this.canteenRepository.update(payload.canteenId, {
        sellerId: payload.sellerId,
      });
      this.logger.log(
        `SELLER ${payload.sellerId} vinculado à cantina ${payload.canteenId}`,
      );
      this.channel.ack(msg);
    } catch (error) {
      this.logger.error("Erro ao processar seller.created", error as Error);
      this.channel.nack(msg, false, false);
    }
  }
}
