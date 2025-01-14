import { z } from "zod";
import { Prisma } from ".prisma/client";
import JsonValue = Prisma.JsonValue;
import {Maybe} from "~/utils/types";

export function parseAsZodType<T, Schema extends z.ZodType<T>>(
  o: Object,
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

export function parseJsonValue<T, Schema extends z.ZodType<T>>(
  json: JsonValue,
  schema: Schema
): z.infer<Schema> {
  return parseAsZodType(json as Object, schema);
}

export function parseString<T, Schema extends z.ZodType<T>>(
  s: string,
  schema: Schema
): z.infer<Schema> {
  return parseAsZodType(s as Object, schema);
}

export function parseNullableString<T, Schema extends z.ZodType<T>>(
    s: Maybe<string>,
    schema: Schema
): Maybe<z.infer<Schema>> {
    if (null === s) {
        return s;
    }
    return parseString(s, schema);
}
