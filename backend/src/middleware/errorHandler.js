class AppError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST', details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function createError(message, status, code, details) {
  return new AppError(message, status, code, details);
}

export default function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}
