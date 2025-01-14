import { Prisma } from ".prisma/client";

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
