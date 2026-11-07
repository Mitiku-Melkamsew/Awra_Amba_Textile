export abstract class DomainError extends Error {
  abstract readonly statusCode: number;
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends DomainError {
  readonly statusCode = 404;
  constructor(message = "Resource not found") {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  readonly statusCode = 403;
  constructor(message = "Insufficient permissions or policy violation") {
    super(message);
  }
}

export class UnauthorizedError extends DomainError {
  readonly statusCode = 401;
  constructor(message = "Authentication required") {
    super(message);
  }
}

export class ConflictError extends DomainError {
  readonly statusCode = 409;
  constructor(message = "Resource conflict or locked state") {
    super(message);
  }
}

export class ValidationError extends DomainError {
  readonly statusCode = 400;
  public readonly errors?: unknown;
  constructor(message = "Invalid input data", errors?: unknown) {
    super(message);
    this.errors = errors;
  }
}
