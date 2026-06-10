import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, Length, Matches } from "class-validator";

export class VerifyCodeDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: "123456", minLength: 6, maxLength: 6 })
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: "code deve conter exatamente 6 dígitos" })
  code: string;
}
