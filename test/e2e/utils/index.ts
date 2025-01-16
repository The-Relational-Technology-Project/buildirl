import {Maybe} from "~/utils/types";

type WithNumberId = { id: number } & Record<string, unknown>;

export function orderByNumberId<T extends WithNumberId>(l: Maybe<T[]>): Maybe<T[]> {
    if (null === l) {
        return null;
    }
    return l.sort((i, j) => i.id - j.id);
}

type WithBigIntId = { id: bigint } & Record<string, unknown>;

export function orderByBigIntId<T extends WithBigIntId>(l: Maybe<T[]>): Maybe<T[]> {
    if (null === l) {
        return null;
    }
    return l.sort((i, j) => {
        if (i.id == j.id) {
            return 0;
        }
        if (i.id > j.id) {
            return 1;
        }
        return -1;
    });
}