import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { StorageModule } from "@shared/infra/storage/storage.module";
import { PRODUCT_REPOSITORY } from "./domain/repositories/product.repository";
import { DrizzleProductRepository } from "./infra/repositories/drizzle-product.repository";
import { ProductService } from "./application/services/product.service";
import { ProductMessagingService } from "./application/services/product-messaging.service";
import { ProductController } from "./infra/controllers/product.controller";

@Module({
  imports: [SharedModule, StorageModule],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductMessagingService,
    DrizzleProductRepository,
    { provide: PRODUCT_REPOSITORY, useExisting: DrizzleProductRepository },
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductsModule {}
