import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Channel, ChannelModel } from "amqplib";
import amqplib from "amqplib";

/**
 * Conexão única com o RabbitMQ. Fornece o canal padrão para publicação e
 * permite criar canais dedicados para consumidores.
 */
@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection?: ChannelModel;
  private channel?: Channel;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.configService.get<string>("RABBITMQ_URL");

    if (!url) {
      this.logger.warn(
        "RABBITMQ_URL não configurada; cliente RabbitMQ desabilitado.",
      );
      return;
    }

    // Retry com backoff — o broker pode ainda não estar aceitando conexões
    // logo após o healthcheck passar (race comum em docker-compose).
    const maxAttempts = 20;
    const delayMs = 3000;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.connection = await amqplib.connect(url);
        this.channel = await this.connection.createChannel();
        this.logger.log("Conexão com RabbitMQ estabelecida");
        return;
      } catch (error) {
        this.logger.warn(
          `RabbitMQ indisponível (tentativa ${attempt}/${maxAttempts}): ${(error as Error).message}`,
        );
        if (attempt === maxAttempts) throw error;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  getChannel(): Channel {
    if (!this.channel) {
      throw new Error("Canal RabbitMQ não inicializado");
    }

    return this.channel;
  }

  async createChannel(): Promise<Channel> {
    if (!this.connection) {
      throw new Error("Conexão RabbitMQ não inicializada");
    }

    return this.connection.createChannel();
  }
}
