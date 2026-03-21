import { plainToInstance } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from "class-validator";

export class EnvironmentVariables {
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
  @IsNotEmpty({ message: "MINIO_SERVER_URL is required" })
  MINIO_SERVER_URL: string;

  @IsString()
  @IsNotEmpty({ message: "MINIO_ROOT_USER is required" })
  MINIO_ROOT_USER: string;

  @IsString()
  @IsNotEmpty({ message: "MINIO_ROOT_PASSWORD is required" })
  MINIO_ROOT_PASSWORD: string;

  @IsString()
  @IsNotEmpty({ message: "MINIO_BUCKET is required" })
  MINIO_BUCKET: string;

  @IsBoolean()
  @IsOptional()
  SWAGGER_ENABLED: boolean = true;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .flatMap((e) => Object.values(e.constraints ?? {}))
      .join("\n  - ");

    throw new Error(`Environment validation failed:\n  - ${messages}`);
  }

  return validated;
}
