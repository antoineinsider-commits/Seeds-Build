import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// SECURITY: without this, NestJS's default error handling can surface
// internal detail to the client outside of HttpExceptions — stack traces,
// ORM/driver error messages, file paths — depending on framework/version
// defaults and how an error was thrown. Catch everything at the edge and
// decide deliberately what the client gets to see.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Always log the full detail server-side for debugging.
    this.logger.error(
      `${request.method} ${request.url} -> ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    const isProduction = process.env.NODE_ENV === 'production';

    let message: string | object;
    if (isHttpException) {
      // HttpException messages (validation errors, "not found", etc.) are
      // already written to be safely user-facing.
      message = exception.getResponse();
    } else if (isProduction) {
      // Never forward raw error messages (Prisma errors, stack traces,
      // etc.) to the client in production.
      message = 'An unexpected error occurred. Please try again.';
    } else {
      // Non-production: surfacing the real message speeds up local/dev
      // debugging and is not exposed to real users.
      message = exception instanceof Error ? exception.message : 'Unknown error';
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
