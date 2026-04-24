import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, sql } from "drizzle-orm";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { EmailService } from "@shared/infra/email/email.service";
import { buildPasswordRecoveryEmail } from "@shared/infra/email/templates/base-email.template";
import {
  USER_REPOSITORY,
  UserRepository,
} from "../../../users/domain/repositories/user.repository";
import { usersSchema } from "../../../users/infra/schemas/user.schema";
import { passwordRecoverySchema } from "../../infra/schemas/password-recovery.schema";

const RECOVERY_TTL_MINUTES = 15;
const GENERIC_RESPONSE_MESSAGE =
  "Se o email existir, um código de recuperação será enviado.";

@Injectable()
export class PasswordRecoveryService {
  private readonly logger = new Logger(PasswordRecoveryService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly drizzle: DrizzleService,
    private readonly emailService: EmailService,
  ) {}

  async requestRecovery(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Não revelar a existência do email — comportamento idempotente.
      return { message: GENERIC_RESPONSE_MESSAGE };
    }

    await this.drizzle.db
      .update(passwordRecoverySchema)
      .set({ isUsed: true })
      .where(
        and(
          eq(passwordRecoverySchema.userId, user.id),
          eq(passwordRecoverySchema.isUsed, false),
        ),
      );

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + RECOVERY_TTL_MINUTES * 60 * 1000);

    await this.drizzle.db.insert(passwordRecoverySchema).values({
      userId: user.id,
      code,
      expiresAt,
      isUsed: false,
    });

    try {
      await this.emailService.sendEmail(
        user.email,
        "Ligeirinho Food — Recuperação de senha",
        buildPasswordRecoveryEmail(code),
      );
    } catch (error) {
      // Falha de envio não deve revelar nada nem permitir bypass.
      this.logger.error(
        `Falha ao enviar email de recuperação para ${user.email}`,
        (error as Error).stack,
      );
    }

    return { message: GENERIC_RESPONSE_MESSAGE };
  }

  async verifyCode(email: string, code: string): Promise<{ message: string }> {
    await this.assertCodeIsValid(email, code);
    return { message: "Código válido." };
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const recovery = await this.assertCodeIsValid(email, code);

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.drizzle.db
      .update(usersSchema)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(usersSchema.id, recovery.userId));

    await this.drizzle.db
      .update(passwordRecoverySchema)
      .set({ isUsed: true })
      .where(eq(passwordRecoverySchema.id, recovery.id));

    return { message: "Senha redefinida com sucesso." };
  }

  private async assertCodeIsValid(
    email: string,
    code: string,
  ): Promise<{ id: string; userId: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException("Código inválido ou expirado.");
    }

    const rows = await this.drizzle.db
      .select({
        id: passwordRecoverySchema.id,
        userId: passwordRecoverySchema.userId,
      })
      .from(passwordRecoverySchema)
      .where(
        and(
          eq(passwordRecoverySchema.userId, user.id),
          eq(passwordRecoverySchema.code, code),
          eq(passwordRecoverySchema.isUsed, false),
          gt(passwordRecoverySchema.expiresAt, sql`now()`),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new BadRequestException("Código inválido ou expirado.");
    }

    return row;
  }

  private generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, "0");
  }
}
