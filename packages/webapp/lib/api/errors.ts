import { z } from 'zod';
import type { ErrorCode } from '@auror/shared/errors';

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode | 'http_error',
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class SessionExpiredError extends ApiClientError {
  constructor() {
    super(401, 'unauthorized', 'Session expired');
    this.name = 'SessionExpiredError';
  }
}

export class ValidationError extends ApiClientError {
  constructor(details: unknown) {
    super(422, 'validation_failed', 'Validation failed', details);
    this.name = 'ValidationError';
  }
}

export class NetworkUnreachableError extends ApiClientError {
  constructor(cause: unknown) {
    super(0, 'network_unreachable', 'Request did not reach the server', cause);
    this.name = 'NetworkUnreachableError';
  }
}

const statusToCode: Record<number, ErrorCode> = {
  400: 'bad_request',
  401: 'unauthorized',
  402: 'payment_failed',
  403: 'forbidden',
  404: 'user_not_found',
  409: 'conflict',
  422: 'validation_failed',
  429: 'rate_limited',
  500: 'internal',
  502: 'payment_processor_error',
};

export const codeFromStatus = (status: number): ErrorCode =>
  statusToCode[status] ?? 'internal';

export const SafeParse = <T extends z.ZodTypeAny>(schema: T) => ({
  schema,
  parse: (input: unknown): z.infer<T> => schema.parse(input),
});
