export class CustomError extends Error {
  status: number;
  statusCode: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.statusCode = status;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export function ForbiddenError(message: string = "Forbidden") {
  return new CustomError(message, 403);
}

export function UnauthorizedError(message: string = "Unauthorized") {
  return new CustomError(message, 401);
}

export function NotFoundError(message: string = "Not Found") {
  return new CustomError(message, 404);
}

export function BadRequestError(message: string = "Bad Request") {
  return new CustomError(message, 400);
}
