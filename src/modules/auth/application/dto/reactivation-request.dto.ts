import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ReactivationRequestDto {
  @ApiProperty({ example: "joao@email.com" })
  @IsEmail()
  email: string;
}
