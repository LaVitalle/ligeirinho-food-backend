import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Canteen } from "../../domain/models/canteen";

export class CanteenResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() institutionId: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() cnpj: string | null;
  @ApiPropertyOptional() block: string | null;
  @ApiPropertyOptional() room: string | null;
  @ApiPropertyOptional() logoUrl: string | null;
  @ApiProperty() isOpen: boolean;
  @ApiProperty() createdAt: Date;

  static from(canteen: Canteen): CanteenResponseDto {
    const dto = new CanteenResponseDto();
    dto.id = canteen.id;
    dto.institutionId = canteen.institutionId;
    dto.name = canteen.name;
    dto.cnpj = canteen.cnpj;
    dto.block = canteen.block;
    dto.room = canteen.room;
    dto.logoUrl = canteen.logoUrl;
    dto.isOpen = canteen.isOpen;
    dto.createdAt = canteen.createdAt;
    return dto;
  }
}
