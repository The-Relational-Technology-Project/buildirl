import { z } from "zod";
import { Maybe } from "~/utils/types";

export function parseAsZodType<T, Schema extends z.ZodType<T>>(
  o: Maybe<Object>,
  schema: Schema
): z.infer<Schema> {
  if (null === o) {
    throw new Error(`expected non-null of type ${schema}`);
  }
  try {
    return schema.parse(o);
  } catch (e) {
    throw new Error(
      `Failed to parse ${o} as type ${schema} with exception ${e}`
    );
  }
}

export function parseNullableAsZodType<T, Schema extends z.ZodType<T>>(
  s: Maybe<Object>,
  schema: Schema
): Maybe<z.infer<Schema>> {
  if (null === s) {
    return s;
  }
  return parseAsZodType(s, schema);
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
