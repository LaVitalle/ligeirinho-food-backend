import { Module } from "@nestjs/common";
import { MinioService } from "./minio.service";

/**
 * Módulo de storage de objetos (MinIO). Importado apenas pelos serviços que
 * lidam com upload de imagens (catalog).
 */
@Module({
  providers: [MinioService],
  exports: [MinioService],
})
export class StorageModule {}
