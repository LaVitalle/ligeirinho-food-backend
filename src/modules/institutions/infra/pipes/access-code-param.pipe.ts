import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

const ACCESS_CODE_REGEX = /^\d{6}$/;

@Injectable()
export class AccessCodeParamPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== "string" || !ACCESS_CODE_REGEX.test(value)) {
      throw new BadRequestException(
        "O código de acesso deve conter exatamente 6 dígitos numéricos.",
      );
    }
    return value;
  }
}
