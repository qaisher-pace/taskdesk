import { HttpError } from '../errors.js';

// Parses req[source] with a zod schema; throws a 400 with field errors on failure.
export function parse(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
  throw new HttpError(400, 'Validation failed', errors);
}
