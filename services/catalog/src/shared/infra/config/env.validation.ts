import { plainToInstance } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from "class-validator";

/**
 * Variáveis comuns a todos os microsserviços. Cada serviço estende esta classe
 * com suas próprias variáveis (ex.: SMTP no identity, MinIO no catalog) e
 * registra o validador via `createEnvValidator(SuaClasse)`.
 */
export class BaseEnvironmentVariables {
  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty({ message: "DATABASE_URL is required" })
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty({ message: "JWT_SECRET is required" })
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  RABBITMQ_URL?: string;

  @IsBoolean()
  @IsOptional()
  SWAGGER_ENABLED: boolean = true;
}

export function createEnvValidator<T extends object>(
  cls: new () => T,
): (config: Record<string, unknown>) => T {
  return (config: Record<string, unknown>): T => {
    const validated = plainToInstance(cls, config, {
      enableImplicitConversion: true,
    });

    const errors = validateSync(validated as object, {
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      const messages = errors
        .flatMap((e) => Object.values(e.constraints ?? {}))
        .join("\n  - ");

      throw new Error(`Environment validation failed:\n  - ${messages}`);
    }

    return validated;
  };
}
