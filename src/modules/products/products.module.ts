import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { PRODUCT_REPOSITORY } from "./domain/repositories/product.repository";
import { DrizzleProductRepository } from "./infra/repositories/drizzle-product.repository";
import { ProductService } from "./application/services/product.service";
import { ProductController } from "./infra/controllers/product.controller";

@Module({
  imports: [SharedModule],
  controllers: [ProductController],
  providers: [
    ProductService,
    DrizzleProductRepository,
    { provide: PRODUCT_REPOSITORY, useExisting: DrizzleProductRepository },
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductsModule {}
