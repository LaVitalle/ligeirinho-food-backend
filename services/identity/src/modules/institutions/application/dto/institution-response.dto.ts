import { ApiProperty } from "@nestjs/swagger";
import { Institution } from "../../domain/models/institution";

export class InstitutionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  photoUrl: string | null;

  @ApiProperty({ example: "123456" })
  accessCode: string;

  @ApiProperty()
  stateId: number;

  @ApiProperty({ required: false, nullable: true })
  stateName: string | null;

  @ApiProperty()
  cityId: number;

  @ApiProperty({ required: false, nullable: true })
  cityName: string | null;

  @ApiProperty()
  createdAt: Date;

  static from(
    institution: Institution,
    stateName?: string | null,
    cityName?: string | null,
  ): InstitutionResponseDto {
    const dto = new InstitutionResponseDto();
    dto.id = institution.id;
    dto.name = institution.name;
    dto.photoUrl = institution.photoUrl;
    dto.accessCode = institution.accessCode;
    dto.stateId = institution.stateId;
    dto.stateName = stateName ?? null;
    dto.cityId = institution.cityId;
    dto.cityName = cityName ?? null;
    dto.createdAt = institution.createdAt;
    return dto;
  }
}

export class InstitutionValidateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  static from(institution: Institution): InstitutionValidateResponseDto {
    const dto = new InstitutionValidateResponseDto();
    dto.id = institution.id;
    dto.name = institution.name;
    return dto;
  }
}
