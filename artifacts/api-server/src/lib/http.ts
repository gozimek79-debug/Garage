import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";

type ValidationIssue = { path: Array<string | number>; message: string };
type ValidationError = { issues: ValidationIssue[] };

function isValidationError(error: unknown): error is ValidationError {
  if (!error || typeof error !== "object" || !("issues" in error)) return false;
  return Array.isArray(error.issues);
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code = "request_failed",
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function asyncRoute(
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export const apiErrorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const isValidation = isValidationError(error);
  const status = error instanceof HttpError
    ? error.status
    : isValidation
      ? 400
      : 500;
  const message = error instanceof HttpError
    ? error.message
    : isValidation
      ? "Please check the submitted information."
      : "An unexpected server error occurred.";
  req.log?.error?.(
    { err: error, status, requestId: req.id },
    "API request failed",
  );
  if (res.headersSent) return;
  res.status(status).json({
    error: error instanceof HttpError
      ? error.code
      : isValidation
        ? "validation_error"
        : "internal_error",
    message,
    ...(isValidation
      ? { fields: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }
      : {}),
    requestId: req.id,
  });
};
