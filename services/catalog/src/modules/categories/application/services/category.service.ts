import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ICON_REPOSITORY,
  IconRepository,
} from "../../../icons/domain/repositories/icon.repository";
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
    @Inject(ICON_REPOSITORY)
    private readonly iconRepository: IconRepository,
  ) {}

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const iconUrl = await this.resolveIconUrl(dto.iconKey ?? null);

    const category = await this.categoryRepository.create({
      name: dto.name,
      iconKey: dto.iconKey ?? null,
      displayOrder: dto.displayOrder ?? 0,
    });
    return CategoryResponseDto.from(category, iconUrl);
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.findAll();
    const icons = await this.iconRepository.findAll();
    const urlByKey = new Map(icons.map((i) => [i.key, i.url]));

    return categories.map((c) =>
      CategoryResponseDto.from(
        c,
        c.iconKey ? (urlByKey.get(c.iconKey) ?? null) : null,
      ),
    );
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("Categoria não encontrada");
    }

    if (dto.iconKey != null) {
      await this.assertIconExists(dto.iconKey);
    }

    const updated = await this.categoryRepository.update(id, {
      name: dto.name,
      iconKey: dto.iconKey,
      displayOrder: dto.displayOrder,
    });

    const iconUrl = await this.resolveIconUrl(updated.iconKey);
    return CategoryResponseDto.from(updated, iconUrl);
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

  private async resolveIconUrl(
    iconKey: string | null,
  ): Promise<string | null> {
    if (iconKey == null) return null;
    const icon = await this.assertIconExists(iconKey);
    return icon.url;
  }

  private async assertIconExists(iconKey: string) {
    const icon = await this.iconRepository.findByKey(iconKey);
    if (!icon) {
      throw new BadRequestException("Ícone (iconKey) não encontrado");
    }
    return icon;
  }
}
