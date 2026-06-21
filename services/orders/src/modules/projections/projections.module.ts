import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { CatalogMessageConsumerService } from "./application/services/catalog-message-consumer.service";
import { CanteenViewRepository } from "./infra/repositories/canteen-view.repository";
import { ProductViewRepository } from "./infra/repositories/product-view.repository";

/**
 * Projeções locais alimentadas por eventos do catalog-service.
 * Expõe os repositórios de leitura (products_view / canteens_view) para que
 * cart e orders validem produto/cantina sem consultar o banco do catalog.
 */
@Module({
  imports: [SharedModule],
  providers: [
    ProductViewRepository,
    CanteenViewRepository,
    CatalogMessageConsumerService,
  ],
  exports: [ProductViewRepository, CanteenViewRepository],
})
export class ProjectionsModule {}
