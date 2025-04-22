/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO resolve this linting error

import { type UseTRPCQueryResult } from "@trpc/react-query/shared";
import { type TRPCClientErrorLike } from "@trpc/client";
import { stringify } from "~/utils";

type CheckInput = {
  result: UseTRPCQueryResult<unknown, TRPCClientErrorLike<any>>;
  fieldName: string;
  params?: Record<string, unknown>;
};

export class QueryError extends Error {
  private constructor(
    fieldName: string,
    params: Record<string, unknown> | undefined,
    cause: string | undefined
  ) {
    super(
      `missing ${fieldName}` +
        (params !== undefined ? ` (params: ${stringify(params)}` : "") +
        (cause !== undefined ? ` with cause: ${cause}` : "")
    );
    Object.setPrototypeOf(this, QueryError.prototype);
  }

  private static isError(
    result: UseTRPCQueryResult<unknown, TRPCClientErrorLike<any>>
  ) {
    return !!result.error;
  }

  private static isNull(
    result: UseTRPCQueryResult<unknown, TRPCClientErrorLike<any>>
  ) {
    return (
      !result.isLoading && (result.data === null || result.data === undefined)
    );
  }

  static check({ result, fieldName, params }: CheckInput): void {
    if (QueryError.isError(result) || QueryError.isNull(result)) {
      throw new QueryError(fieldName, params, result.error?.message);
    }
  }

  static checkNullable({ result, fieldName, params }: CheckInput): void {
    if (QueryError.isError(result)) {
      throw new QueryError(fieldName, params, result.error?.message);
    }
  }
}
