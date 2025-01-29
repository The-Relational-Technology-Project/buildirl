import { type TRPCClientErrorLike } from "@trpc/client";
import { type UseTRPCQueryResult } from "@trpc/react-query/shared";

export function isLoaded(
  result: UseTRPCQueryResult<unknown, TRPCClientErrorLike<any>>
): boolean {
  return !result.isLoading;
}

export function isAllLoaded(
  results: Array<UseTRPCQueryResult<unknown, TRPCClientErrorLike<any>>>
): boolean {
  let isAllLoaded = true;
  for (const r of results) {
    if (!isLoaded(r)) {
      isAllLoaded = false;
    }
  }
  return isAllLoaded;
}

export function toDisplayMonth(dateTime: Date): string {
  return dateTime.toLocaleDateString("en-us", {
    year: "numeric",
    month: "long"
  });
}

export function paramAsString(param: string | string[] | undefined): string {
  if (!param || typeof param !== "string") {
    throw new Error(`expected param as string but found ${param}`);
  }
  return param;
}
