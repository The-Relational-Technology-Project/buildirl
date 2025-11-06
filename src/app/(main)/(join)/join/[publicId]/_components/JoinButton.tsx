import { QueryError } from "~/client/utils/QueryError";
import { Club } from "~/server/club/types";
import { api } from "~/trpc/react";
import { AuthenticatedJoinButton } from "./AuthenticatedJoinButton";
import { DefaultJoinButton } from "./DefaultJoinButton";

export type JoinButtonProps = {
  club: Club;
};

export function JoinButton({ club }: JoinButtonProps) {
  const isUserAuthenticated = api.main.isUserAuthenticated.useQuery();

  QueryError.check({
    result: isUserAuthenticated,
    fieldName: "isUserAuthenticated"
  });

  if (isUserAuthenticated.data!) {
    return <AuthenticatedJoinButton club={club} />;
  }
  return <DefaultJoinButton club={club} />;
}
