import { Module } from "@nestjs/common";
import { EmailModule } from "@shared/infra/email/email.module";
import { UsersModule } from "../users/users.module";
import { CanteenMessageConsumerService } from "./canteen-message-consumer.service";
import { OrderMessageConsumerService } from "./order-message-consumer.service";
import { SellerMessagingService } from "./seller-messaging.service";

/**
 * Integração assíncrona do identity com os demais serviços via RabbitMQ.
 * - Consome catalog:canteen.created -> cria SELLER -> publica identity:seller.created
 * - Consome orders:order.created / order.status_changed -> envia e-mail
 */
@Module({
  imports: [UsersModule, EmailModule],
  providers: [
    SellerMessagingService,
    CanteenMessageConsumerService,
    OrderMessageConsumerService,
  ],
})
export class IntegrationModule {}
