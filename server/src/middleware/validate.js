import { flattenError } from 'zod';

/**
 * Parses req.body against a zod schema, replacing it with the parsed result so
 * downstream handlers get coerced, stripped values rather than raw input.
 * Responds 400 with per-field messages on failure.
 */
export function validateBody(schema) {
  return function bodyValidator(req, res, next) {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        fields: flattenError(result.error).fieldErrors,
      });
    }

    req.body = result.data;
    return next();
  };
}
