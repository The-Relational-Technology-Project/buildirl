import { type Arbitrary, int32Array } from "fast-check";

export type ItemSelector<T> = {
  select(l: T[]): T;
  selectMany(l: T[], count: number): T[];
};

function createItemSelector<T>(i: number[]): ItemSelector<T> {
  const indices = i;

  function select(l: T[]): T {
    if (0 === l.length) {
      throw new Error("cannot select from empty array");
    }
    if (0 === indices.length) {
      throw new Error("missing index to select single item");
    }
    return l[indices[0]! % l.length]!;
  }

  function selectMany(l: T[], count: number): T[] {
    if (count > l.length) {
      throw new Error(
        `cannot select ${count} items from array of size ${l.length}`
      );
    }
    if (count > indices.length) {
      throw new Error(
        `missing indices (max: ${indices.length}) to select ${count} items`
      );
    }
    const selected: T[] = [];
    const copy = [...l];
    while (selected.length < count) {
      const s = copy.splice(indices[selected.length]! % copy.length, 1);
      selected.push(...s);
    }
    return selected;
  }

  return {
    select,
    selectMany
  };
}

export default function itemSelector<T>(): Arbitrary<ItemSelector<T>> {
  return int32Array({
    minLength: 100,
    maxLength: 100,
    // large enough number for uniform distribution across small array sizes < 1000
    min: 1000,
    max: 99999
  }).map((i) => createItemSelector([...i]));
}
