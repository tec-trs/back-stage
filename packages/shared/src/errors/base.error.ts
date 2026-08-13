export abstract class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  protected constructor(message: string, code: string, statusCode: number, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string, identifier: string) {
    super(`${resource} nao encontrado: ${identifier}`, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends BaseError {
  public readonly details: Record<string, string[]>;

  constructor(message: string, details: Record<string, string[]> = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    this.details = details;
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message = 'Nao autorizado') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message = 'Acesso negado') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}
