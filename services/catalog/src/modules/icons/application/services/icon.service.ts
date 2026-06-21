import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MinioService } from "@shared/infra/storage/minio.service";
import { randomUUID } from "crypto";
import {
  ICON_REPOSITORY,
  IconRepository,
} from "../../domain/repositories/icon.repository";
import {
  CreateIconDto,
  IconResponseDto,
  UpdateIconDto,
} from "../dto/icon.dto";

@Injectable()
export class IconService {
  constructor(
    @Inject(ICON_REPOSITORY)
    private readonly iconRepository: IconRepository,
    private readonly minioService: MinioService,
  ) {}

  async create(
    dto: CreateIconDto,
    file?: Express.Multer.File,
  ): Promise<IconResponseDto> {
    if (!file) {
      throw new BadRequestException("Arquivo do ícone é obrigatório");
    }

    const existing = await this.iconRepository.findByKey(dto.key);
    if (existing) {
      throw new ConflictException("Já existe um ícone com essa key");
    }

    const url = await this.uploadFile(file);

    const icon = await this.iconRepository.create({
      key: dto.key,
      name: dto.name,
      url,
      tag: dto.tag ?? null,
    });
    return IconResponseDto.from(icon);
  }

  async findAll(filters?: {
    tag?: string;
    search?: string;
  }): Promise<IconResponseDto[]> {
    const icons = await this.iconRepository.findAll(filters);
    return icons.map(IconResponseDto.from);
  }

  async findById(id: string): Promise<IconResponseDto> {
    const icon = await this.iconRepository.findById(id);
    if (!icon) {
      throw new NotFoundException("Ícone não encontrado");
    }
    return IconResponseDto.from(icon);
  }

  async update(
    id: string,
    dto: UpdateIconDto,
    file?: Express.Multer.File,
  ): Promise<IconResponseDto> {
    const existing = await this.iconRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("Ícone não encontrado");
    }

    const url = file ? await this.uploadFile(file) : undefined;

    const updated = await this.iconRepository.update(id, {
      name: dto.name,
      tag: dto.tag,
      url,
    });
    return IconResponseDto.from(updated);
  }

  async remove(id: string): Promise<void> {
    const icon = await this.iconRepository.findById(id);
    if (!icon) {
      throw new NotFoundException("Ícone não encontrado");
    }

    const inUse = await this.iconRepository.isKeyInUse(icon.key);
    if (inUse) {
      throw new ConflictException(
        "Não é possível remover ícone em uso por uma categoria",
      );
    }

    await this.iconRepository.delete(id);
  }

  private async uploadFile(file: Express.Multer.File): Promise<string> {
    const ext = (file.originalname.split(".").pop() ?? "bin").toLowerCase();
    const key = `icons/${randomUUID()}.${ext}`;
    return this.minioService.upload(key, file.buffer, file.mimetype);
  }
}
