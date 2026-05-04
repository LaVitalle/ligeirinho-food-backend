import { ApiProperty } from "@nestjs/swagger";
import { UserDto } from "../../../users/application/dto/user.dto";

export class AuthResponseDto {
  @ApiProperty({
    description: "Token JWT de acesso. Envie no header Authorization: Bearer <token>",
    example:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1dWlkLWRvLXVzdWFyaW8iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NDYzOTkxMjIsImV4cCI6MTc0NjQ4NTUyMn0.assinatura",
  })
  accessToken: string;

  @ApiProperty({
    description: "Dados do usuário autenticado",
    type: UserDto,
  })
  user: UserDto;
}
