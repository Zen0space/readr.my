import type { ErrorCode } from './codes'

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    public readonly devMessage: string,
    public readonly details?: unknown,
  ) {
    super(devMessage)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  public readonly code: ErrorCode = 'network_unreachable'
  constructor(public readonly cause?: unknown) {
    super('Request did not reach the server')
    this.name = 'NetworkError'
  }
}
