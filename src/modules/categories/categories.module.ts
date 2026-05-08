import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { CATEGORY_REPOSITORY } from "./domain/repositories/category.repository";
import { DrizzleCategoryRepository } from "./infra/repositories/drizzle-category.repository";
import { CategoryService } from "./application/services/category.service";
import { CategoryController } from "./infra/controllers/category.controller";

@Module({
  imports: [SharedModule],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    DrizzleCategoryRepository,
    { provide: CATEGORY_REPOSITORY, useExisting: DrizzleCategoryRepository },
  ],
  exports: [CATEGORY_REPOSITORY],
})
export class CategoriesModule {}
