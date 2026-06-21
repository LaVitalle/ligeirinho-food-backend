import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import bcrypt from "bcryptjs";
import type { Channel, ConsumeMessage } from "amqplib";
import {
  CatalogExchangeName,
  CatalogRoutingKey,
  type CanteenCreatedPayload,
} from "@shared/contracts/events/catalog-events.enum";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { RabbitMQService } from "@shared/infra/messaging/rabbitmq.service";
import {
  USER_REPOSITORY,
  UserRepository,
} from "../users/domain/repositories/user.repository";
import { SellerMessagingService } from "./seller-messaging.service";

const EXCHANGE_TYPE = "direct";
const QUEUE = "identity.catalog-canteens.created.queue";

/**
 * Consome canteen.created (publicado pelo catalog) e cria o usuário SELLER
 * (1:1 com a cantina). Em seguida publica seller.created para o catalog
 * vincular o seller à cantina (consistência eventual).
 */
@Injectable()
export class CanteenMessageConsumerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(CanteenMessageConsumerService.name);
  private channel?: Channel;

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly sellerMessaging: SellerMessagingService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      this.channel = await this.rabbitMQService.createChannel();
      await this.channel.assertExchange(
        CatalogExchangeName.CANTEEN_CREATED,
        EXCHANGE_TYPE,
        { durable: true },
      );
      await this.channel.assertQueue(QUEUE, { durable: true });
      await this.channel.bindQueue(
        QUEUE,
        CatalogExchangeName.CANTEEN_CREATED,
        CatalogRoutingKey.CANTEEN_CREATED,
      );
      await this.channel.consume(QUEUE, (msg) => void this.handle(msg));
      this.logger.log(`Consumindo fila "${QUEUE}"`);
    } catch (error) {
      this.logger.error(
        "Falha ao iniciar consumidor de canteen.created",
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
      ) as CanteenCreatedPayload;
      await this.createSeller(payload);
      this.channel.ack(msg);
    } catch (error) {
      this.logger.error("Erro ao processar canteen.created", error as Error);
      this.channel.nack(msg, false, false);
    }
  }

  private async createSeller(payload: CanteenCreatedPayload): Promise<void> {
    const existing = await this.userRepository.findByEmail(payload.sellerEmail);
    if (existing) {
      this.logger.warn(
        `Email ${payload.sellerEmail} já em uso; cantina ${payload.canteenId} sem SELLER novo`,
      );
      if (
        existing.role === UserRole.SELLER &&
        existing.canteenId === payload.canteenId
      ) {
        await this.sellerMessaging.publishSellerCreated({
          canteenId: payload.canteenId,
          sellerId: existing.id,
          sellerEmail: existing.email,
        });
      }
      return;
    }

    const passwordHash = await bcrypt.hash(payload.sellerPassword, 10);
    const seller = await this.userRepository.create({
      fullName: payload.sellerName,
      email: payload.sellerEmail,
      passwordHash,
      role: UserRole.SELLER,
      institutionId: payload.institutionId,
      canteenId: payload.canteenId,
    });

    this.logger.log(
      `SELLER ${seller.id} criado para a cantina ${payload.canteenId}`,
    );

    await this.sellerMessaging.publishSellerCreated({
      canteenId: payload.canteenId,
      sellerId: seller.id,
      sellerEmail: seller.email,
    });
  }
}
