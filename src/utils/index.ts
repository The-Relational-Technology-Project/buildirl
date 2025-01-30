import { Prisma } from ".prisma/client";
import { Maybe } from "~/utils/types";

/**
 * A version of stringify that handles bigints using string as a pass-through
 * https://stackoverflow.com/questions/65152373/typescript-serialize-bigint-in-json
 */
export function stringify<T>(data: T): string {
  return JSON.stringify(data, (key, value) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    typeof value === "bigint" ? value.toString() : value
  );
}

export function strictParseInt(s: Maybe<string>): number {
  if (null === s) {
    throw new Error(`${s} is not a int`);
  }
  const r = parseInt(s);
  if (isNaN(r)) {
    throw new Error(`${s} is not an int`);
  }
  return r;
}
