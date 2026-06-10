import { Injectable, Logger } from "@nestjs/common";
import { RabbitMQService } from "./rabbitmq.service";

/**
 * Helpers de publicação sobre o canal padrão do RabbitMQ.
 * Um exchange (tipo `direct`, durável) por tipo de evento, igual ao padrão
 * adotado nas aulas de microsserviços.
 */
@Injectable()
export class SharedMessagingService {
  private readonly logger = new Logger(SharedMessagingService.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async assertExchange(name: string, type = "direct"): Promise<void> {
    const channel = this.rabbitMQService.getChannel();
    await channel.assertExchange(name, type, { durable: true });
  }

  async publish(
    exchangeName: string,
    routingKey: string,
    payload: unknown,
  ): Promise<void> {
    const channel = this.rabbitMQService.getChannel();

    channel.publish(
      exchangeName,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        contentType: "application/json",
      },
    );

    this.logger.log(
      `Evento publicado no exchange "${exchangeName}" (routing key "${routingKey}")`,
    );
  }
}
