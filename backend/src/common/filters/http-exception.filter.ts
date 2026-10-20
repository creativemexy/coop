import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MonitoringService } from '../monitoring/monitoring.service';

function buildMonitoringContext(request: Request) {
  return {
    method: request.method,
    url: request.originalUrl || request.url,
    route: request.route?.path || request.path,
    ip: request.ip,
    requestId:
      (request.headers['x-request-id'] as string | undefined) ??
      (request.headers['x-correlation-id'] as string | undefined) ??
      null,
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly monitoring: MonitoringService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    }

    const errorMessage =
      exception instanceof Error ? exception.message : 'Unknown error';
    const errorResponse = {
      statusCode: status,
      message:
        typeof message === 'string'
          ? message
          : (message as any).message || message,
      error: typeof message === 'string' ? undefined : (message as any).error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= 500 && this.monitoring) {
      const context = buildMonitoringContext(request);
      if (exception instanceof Error) {
        this.monitoring.captureException(exception, context);
      }
    }

    response.status(status).json(errorResponse);
  }
}
