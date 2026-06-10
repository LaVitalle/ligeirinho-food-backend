import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>("SMTP_HOST")!;
    const port = Number(this.configService.get<string>("SMTP_PORT") ?? 587);
    const user = this.configService.get<string>("SMTP_USER")!;
    const pass = this.configService.get<string>("SMTP_PASS")!;
    this.from =
      this.configService.get<string>("SMTP_FROM") ??
      "Ligeirinho Food <no-reply@ligeirinho.local>";

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Falha ao enviar email para ${to}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        "Falha ao enviar email. Tente novamente mais tarde.",
      );
    }
  }
}
