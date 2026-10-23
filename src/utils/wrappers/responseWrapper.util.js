export class ResponseError extends Error {
  constructor(sm, statusCode, error, field) {
    super(typeof error === 'string' ? error : 'An error occurred');
    this.sm = sm;
    this.statusCode = statusCode || 500;
    this.error = error;
    this.field = field;
  }
}

export class ResponseHandler {
  static success(sm, data, field) {
    const result = { sm, data };
    if (field !== undefined) result.field = field;
    return result;
  }

  static error(sm, statusCode, error, field) {
    throw new ResponseError(sm, statusCode, error, field);
  }
}

export const AsyncWrapper = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((err) => {
    if (err instanceof ResponseError) {
      return res.status(err.statusCode).json({
        sm: err.sm,
        error: err.error,
        field: err.field,
      });
    }
    return res.status(500).json({ sm: 2, error: err.message });
  });
