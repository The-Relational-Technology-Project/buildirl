/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO resolve this linting error

import { type TRPCClientErrorLike } from "@trpc/client";
import { type UseTRPCQueryResult } from "@trpc/react-query/shared";
import { BillingInterval } from "~/utils/types";

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

export function toDisplayDate(dateTime: Date): string {
  return dateTime.toLocaleDateString("en-us", {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });
}

export function formatBillingInterval(interval: BillingInterval): string {
  switch (interval) {
    case BillingInterval.MONTHLY:
      return "month";
    case BillingInterval.QUARTERLY:
      return "quarter";
    case BillingInterval.SEMI_ANNUAL:
      return "6 months";
  }
}
