import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ErrorLogRepository } from "../repositories/error-log.repository";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly errorLogRepository: ErrorLogRepository) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let code = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal server error";
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      code = exception.getStatus();
      stack = exception.stack;
      const exceptionResponse = exception.getResponse();

      message =
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message as
              | string
              | string[];
    } else if (exception instanceof Error) {
      stack = exception.stack;
      this.logger.error(exception.message, stack);
    } else {
      this.logger.error(exception);
    }

    if (Array.isArray(message)) {
      message = message.join(", ");
    }

    this.persistLog({
      status: code,
      message,
      stack,
      path: request.url,
      method: request.method,
    });

    response.status(code).json({
      data: [],
      status: { code, message },
      pagination: {},
    });
  }

  private persistLog(data: {
    status: number;
    message: string;
    stack?: string;
    path: string;
    method: string;
  }): void {
    this.errorLogRepository.create(data).catch((err) => {
      this.logger.warn("Failed to persist error log to database", err);
    });
  }
}
