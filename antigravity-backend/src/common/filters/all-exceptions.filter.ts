import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttp ? exception.getResponse() : null;

    let message = 'An unexpected internal error occurred';
    let errorType = 'InternalServerError';

    if (isHttp) {
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        message = (exceptionResponse as any).message || exception.message;
        errorType = (exceptionResponse as any).error || errorType;
      }
    } else {
      // Unhandled server error (Prisma, DB, third-party)
      const err = exception as any;
      this.logger.error(
        `Unhandled Exception on ${request.method} ${request.url}: ${err?.message || err}`,
        err?.stack,
      );
      // In production, do not leak internal stack or database error messages
      if (process.env.NODE_ENV === 'production') {
        message = 'Internal server error. Please try again later.';
      } else {
        message = err?.message || 'Internal server error';
      }
    }

    response.status(status).json({
      statusCode: status,
      error: errorType,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
