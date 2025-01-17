export type Maybe<T> = T | null;

export type Id = number | bigint;

// helper unwrap methods for converting id to proper types
export function idAsNumber(maybeId: Maybe<Id>): number {
  if (null === maybeId) {
    throw new Error("expected non-null id but was null");
  }
  if (typeof maybeId !== "number") {
    throw new Error(
      "expected id " + maybeId + " as number type but was " + typeof maybeId
    );
  }
  return maybeId;
}

export function idAsBigInt(maybeId: Maybe<Id>): bigint {
  if (null === maybeId) {
    throw new Error("expected non-null id but was null");
  }
  if (typeof maybeId !== "bigint") {
    throw new Error(
      "expected id " + maybeId + " as bigint type but was " + typeof maybeId
    );
  }
  return maybeId;
}
