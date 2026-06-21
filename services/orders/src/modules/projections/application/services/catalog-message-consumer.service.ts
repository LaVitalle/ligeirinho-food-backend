import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import type { Channel, ConsumeMessage } from "amqplib";
import {
  CatalogExchangeName,
  CatalogRoutingKey,
  type CanteenProjectionPayload,
  type ProductProjectionPayload,
} from "@shared/contracts/events/catalog-events.enum";
import { RabbitMQService } from "@shared/infra/messaging/rabbitmq.service";
import { CanteenViewRepository } from "../../infra/repositories/canteen-view.repository";
import { ProductViewRepository } from "../../infra/repositories/product-view.repository";

const EXCHANGE_TYPE = "direct";
const QUEUES = {
  productUpserted: "orders.catalog-products.upserted.queue",
  productDeleted: "orders.catalog-products.deleted.queue",
  canteenUpdated: "orders.catalog-canteens.updated.queue",
} as const;

/**
 * Consome eventos do catalog-service e mantém as projeções locais
 * (products_view / canteens_view) atualizadas. É assim que o orders evita
 * consultar o banco do catalog em tempo de request.
 */
@Injectable()
export class CatalogMessageConsumerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(CatalogMessageConsumerService.name);
  private channel?: Channel;

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly productView: ProductViewRepository,
    private readonly canteenView: CanteenViewRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      this.channel = await this.rabbitMQService.createChannel();

      await this.registerConsumer(
        QUEUES.productUpserted,
        CatalogExchangeName.PRODUCT_UPSERTED,
        CatalogRoutingKey.PRODUCT_UPSERTED,
        (payload) =>
          this.productView.upsert(payload as ProductProjectionPayload),
      );

      await this.registerConsumer(
        QUEUES.productDeleted,
        CatalogExchangeName.PRODUCT_DELETED,
        CatalogRoutingKey.PRODUCT_DELETED,
        (payload) =>
          this.productView.delete(
            (payload as ProductProjectionPayload).productId,
          ),
      );

      await this.registerConsumer(
        QUEUES.canteenUpdated,
        CatalogExchangeName.CANTEEN_UPDATED,
        CatalogRoutingKey.CANTEEN_UPDATED,
        (payload) =>
          this.canteenView.upsert(payload as CanteenProjectionPayload),
      );
    } catch (error) {
      this.logger.error(
        "Falha ao iniciar consumidores de projeções do catalog",
        error as Error,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
  }

  private async registerConsumer(
    queueName: string,
    exchangeName: string,
    routingKey: string,
    handler: (payload: unknown) => Promise<void>,
  ): Promise<void> {
    if (!this.channel) return;
    await this.channel.assertExchange(exchangeName, EXCHANGE_TYPE, {
      durable: true,
    });
    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.bindQueue(queueName, exchangeName, routingKey);
    await this.channel.consume(
      queueName,
      (msg) => void this.consume(queueName, msg, handler),
    );
    this.logger.log(`Consumindo fila "${queueName}"`);
  }

  private async consume(
    queueName: string,
    msg: ConsumeMessage | null,
    handler: (payload: unknown) => Promise<void>,
  ): Promise<void> {
    if (!msg || !this.channel) return;
    try {
      await handler(JSON.parse(msg.content.toString()) as unknown);
      this.channel.ack(msg);
    } catch (error) {
      this.logger.error(
        `Erro ao processar fila "${queueName}"`,
        error as Error,
      );
      this.channel.nack(msg, false, false);
    }
  }
}
