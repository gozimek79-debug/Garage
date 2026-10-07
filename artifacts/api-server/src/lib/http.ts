import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";

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
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof HttpError ? error.message : "An unexpected server error occurred.";
  req.log?.error?.(
    { err: error, status, requestId: req.id },
    "API request failed",
  );
  if (res.headersSent) return;
  res.status(status).json({
    error: error instanceof HttpError ? error.code : "internal_error",
    message,
    requestId: req.id,
  });
};
