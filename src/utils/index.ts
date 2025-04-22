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

export function strictParseBigInt(s: Maybe<string>): bigint {
  if (null === s) {
    throw new Error(`${s} is not a bigint`);
  }
  return BigInt(s);
}

export function assertAsString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  throw new Error(`value ${value} is not a string`);
}

export function assertAsStringArray(value: string | string[]): string[] {
  if (typeof value === "string") {
    throw new Error(`value ${value} is not a string array`);
  }
  return value;
}

export function findOne<T>(l: T[], filter: (i: T) => boolean): T {
  const r = l.filter((i) => filter(i));
  if (r.length !== 1) {
    throw new Error(
      `expected to find exactly 1 match but found ${stringify(l)}`
    );
  }
  return r[0]!;
}
