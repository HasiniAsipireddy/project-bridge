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
      const { fieldErrors, formErrors } = flattenError(result.error);
      return res.status(400).json({
        error: 'Validation failed',
        fields: fieldErrors,
        // Whole-body errors from .refine() land here rather than on a field;
        // without this they would be dropped and the 400 would say nothing.
        ...(formErrors.length ? { form: formErrors } : {}),
      });
    }

    req.body = result.data;
    return next();
  };
}
