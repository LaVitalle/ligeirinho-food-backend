import {
  BaseEnvironmentVariables,
  createEnvValidator,
} from "@shared/infra/config/env.validation";
import { IsNotEmpty, IsString } from "class-validator";

export class EnvironmentVariables extends BaseEnvironmentVariables {
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
