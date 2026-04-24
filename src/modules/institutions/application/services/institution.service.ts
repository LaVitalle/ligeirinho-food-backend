import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomInt, randomUUID } from "crypto";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { MinioService } from "@shared/infra/storage/minio.service";
import {
  INSTITUTION_REPOSITORY,
  InstitutionRepository,
} from "../../domain/repositories/institution.repository";
import { CreateInstitutionDto } from "../dto/create-institution.dto";
import {
  InstitutionResponseDto,
  InstitutionValidateResponseDto,
} from "../dto/institution-response.dto";
import { UpdateInstitutionDto } from "../dto/update-institution.dto";

const ACCESS_CODE_MAX_RETRIES = 5;

@Injectable()
export class InstitutionService {
  constructor(
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: InstitutionRepository,
    private readonly minioService: MinioService,
  ) {}

  async create(
    dto: CreateInstitutionDto,
    photo?: Express.Multer.File,
  ): Promise<InstitutionResponseDto> {
    const accessCode = await this.generateUniqueAccessCode();

    let photoUrl: string | null = null;
    if (photo) {
      photoUrl = await this.uploadPhoto(photo);
    }

    const institution = await this.institutionRepository.create({
      name: dto.name,
      accessCode,
      photoUrl,
      stateId: dto.stateId,
      cityId: dto.cityId,
    });

    return InstitutionResponseDto.from(institution);
  }

  async findAll(
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<InstitutionResponseDto>> {
    const result = await this.institutionRepository.findAll(page, perPage);
    return result.map((row) =>
      InstitutionResponseDto.from(row.institution, row.stateName, row.cityName),
    );
  }

  async findById(id: string): Promise<InstitutionResponseDto> {
    const row = await this.institutionRepository.findById(id);
    if (!row) {
      throw new NotFoundException("Instituição não encontrada");
    }
    return InstitutionResponseDto.from(
      row.institution,
      row.stateName,
      row.cityName,
    );
  }

  async update(
    id: string,
    dto: UpdateInstitutionDto,
    photo?: Express.Multer.File,
  ): Promise<InstitutionResponseDto> {
    const existing = await this.institutionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("Instituição não encontrada");
    }

    let photoUrl: string | undefined;
    if (photo) {
      photoUrl = await this.uploadPhoto(photo);
    }

    const updated = await this.institutionRepository.update(id, {
      name: dto.name,
      stateId: dto.stateId,
      cityId: dto.cityId,
      photoUrl,
    });

    const refreshed = await this.institutionRepository.findById(updated.id);
    return InstitutionResponseDto.from(
      refreshed?.institution ?? updated,
      refreshed?.stateName ?? null,
      refreshed?.cityName ?? null,
    );
  }

  async delete(id: string): Promise<void> {
    const existing = await this.institutionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("Instituição não encontrada");
    }
    await this.institutionRepository.delete(id);
  }

  async validateAccessCode(
    accessCode: string,
  ): Promise<InstitutionValidateResponseDto> {
    const institution =
      await this.institutionRepository.findByAccessCode(accessCode);
    if (!institution) {
      throw new NotFoundException("Código de acesso inválido");
    }
    return InstitutionValidateResponseDto.from(institution);
  }

  private async generateUniqueAccessCode(): Promise<string> {
    for (let attempt = 0; attempt < ACCESS_CODE_MAX_RETRIES; attempt++) {
      const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
      const exists = await this.institutionRepository.existsByAccessCode(code);
      if (!exists) return code;
    }
    throw new ConflictException(
      "Não foi possível gerar um código de acesso único. Tente novamente.",
    );
  }

  private async uploadPhoto(photo: Express.Multer.File): Promise<string> {
    const extension = (photo.originalname.split(".").pop() ?? "bin").toLowerCase();
    const key = `institutions/${randomUUID()}.${extension}`;
    return this.minioService.upload(key, photo.buffer, photo.mimetype);
  }
}
