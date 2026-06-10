import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";

/**
 * Módulo de envio de e-mail (Nodemailer/SMTP). Importado apenas pelo
 * identity-service (recuperação de senha, reativação, confirmação de pedido).
 */
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
