

export class applicationException extends Error {
  constructor(message: string, public statusCode: number, cause?: unknown) {
    super(message, { cause })
    this.name = this.constructor.name,
      Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundException extends applicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 404, cause)
  }
}

export class BadRequestException extends applicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 400, cause)
  }
}

export class UnauthorizedException extends applicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 401, cause)
  }
}

export class ForbiddenException extends applicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 403, cause)
  }
}

export class ConflictException extends applicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 409, cause)
  }
}
