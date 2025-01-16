import {Maybe} from "~/utils/types";

type WithId = { id: number } & Record<string, unknown>;

export function orderById<T extends WithId>(l: Maybe<T[]>): Maybe<T[]> {
    if (null === l) {
        return null;
    }
    return l.sort((i, j) => i.id - j.id);
}