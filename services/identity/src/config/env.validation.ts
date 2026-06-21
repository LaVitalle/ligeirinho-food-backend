import {
  BaseEnvironmentVariables,
  createEnvValidator,
} from "@shared/infra/config/env.validation";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class EnvironmentVariables extends BaseEnvironmentVariables {
  @IsString()
  @IsNotEmpty({ message: "SMTP_HOST is required" })
  SMTP_HOST: string;

  @IsNumber()
  @IsOptional()
  SMTP_PORT: number = 587;

  @IsString()
  @IsNotEmpty({ message: "SMTP_USER is required" })
  SMTP_USER: string;

  @IsString()
  @IsNotEmpty({ message: "SMTP_PASS is required" })
  SMTP_PASS: string;

  @IsString()
  @IsOptional()
  SMTP_FROM?: string;

  // MinIO — fotos de instituição
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
}

export const validate = createEnvValidator(EnvironmentVariables);
