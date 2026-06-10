import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
} from "../../domain/repositories/category.repository";
import {
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../dto/category.dto";

@Injectable()
export class CategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.create({
      name: dto.name,
      iconKey: dto.iconKey ?? null,
      displayOrder: dto.displayOrder ?? 0,
    });
    return CategoryResponseDto.from(category);
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.findAll();
    return categories.map(CategoryResponseDto.from);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("Categoria não encontrada");
    }
    const updated = await this.categoryRepository.update(id, {
      name: dto.name,
      iconKey: dto.iconKey,
      displayOrder: dto.displayOrder,
    });
    return CategoryResponseDto.from(updated);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("Categoria não encontrada");
    }
    const hasProducts = await this.categoryRepository.hasProducts(id);
    if (hasProducts) {
      throw new ConflictException(
        "Não é possível remover categoria com produtos vinculados",
      );
    }
    await this.categoryRepository.delete(id);
  }
}
