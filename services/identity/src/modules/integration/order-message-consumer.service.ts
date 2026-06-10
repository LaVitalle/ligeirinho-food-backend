import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import type { Channel, ConsumeMessage } from "amqplib";
import {
  OrdersExchangeName,
  OrdersRoutingKey,
  type OrderCreatedPayload,
  type OrderStatusChangedPayload,
} from "@shared/contracts/events/orders-events.enum";
import { EmailService } from "@shared/infra/email/email.service";
import { buildOrderConfirmationEmail } from "@shared/infra/email/templates/base-email.template";
import { RabbitMQService } from "@shared/infra/messaging/rabbitmq.service";

const EXCHANGE_TYPE = "direct";
const QUEUES = {
  created: "identity.orders.created.queue",
  statusChanged: "identity.orders.status-changed.queue",
} as const;

/**
 * Consome eventos do orders-service e dispara e-mails ao cliente
 * (confirmação de pedido e mudança de status).
 */
@Injectable()
export class OrderMessageConsumerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(OrderMessageConsumerService.name);
  private channel?: Channel;

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly emailService: EmailService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      this.channel = await this.rabbitMQService.createChannel();
      await this.registerConsumer(
        QUEUES.created,
        OrdersExchangeName.ORDER_CREATED,
        OrdersRoutingKey.ORDER_CREATED,
        (payload) => this.handleCreated(payload as OrderCreatedPayload),
      );
      await this.registerConsumer(
        QUEUES.statusChanged,
        OrdersExchangeName.ORDER_STATUS_CHANGED,
        OrdersRoutingKey.ORDER_STATUS_CHANGED,
        (payload) =>
          this.handleStatusChanged(payload as OrderStatusChangedPayload),
      );
    } catch (error) {
      this.logger.error(
        "Falha ao iniciar consumidores de pedidos",
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
    await this.channel.consume(queueName, (msg) =>
      void this.consume(queueName, msg, handler),
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
      this.logger.error(`Erro ao processar fila "${queueName}"`, error as Error);
      this.channel.nack(msg, false, false);
    }
  }

  private async handleCreated(payload: OrderCreatedPayload): Promise<void> {
    await this.emailService.sendEmail(
      payload.customerEmail,
      "Ligeirinho Food — Pedido confirmado",
      buildOrderConfirmationEmail({
        customerName: payload.customerName,
        orderId: payload.orderId,
        canteenName: payload.canteenName,
        total: payload.total,
      }),
    );
  }

  private async handleStatusChanged(
    payload: OrderStatusChangedPayload,
  ): Promise<void> {
    await this.emailService.sendEmail(
      payload.customerEmail,
      `Ligeirinho Food — Pedido ${payload.status}`,
      buildOrderConfirmationEmail({
        customerName: payload.customerName,
        orderId: payload.orderId,
      }),
    );
  }
}
