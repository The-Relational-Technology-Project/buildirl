import { z } from "zod";
import { Maybe } from "~/utils/types";

export function parseAsZodType<T, Schema extends z.ZodType<T>>(
  o: Maybe<Object>,
  schema: Schema
): z.infer<Schema> {
  try {
    return schema.parse(o);
  } catch (e) {
    throw new Error(
      `Failed to parse ${o} as type ${schema} with exception ${e}`
    );
  }
}

export function isZodType<T, Schema extends z.ZodType<T>>(
  o: Object,
  schema: Schema
): boolean {
  try {
    schema.parse(o);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Returns error string if failed and null if success
 *
 * Can be used for client-side form validation
 */
export function safeValidateSchema<T extends z.ZodType>(
  schema: T,
  value: unknown
): Maybe<string> {
  const result = schema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0]?.message ?? "Invalid input";
  }
  return null;
}
