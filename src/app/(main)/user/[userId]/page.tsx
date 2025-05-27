"use client";

import { Center } from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { useParams, useSearchParams } from "next/navigation";
import React from "react";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { strictParseInt } from "~/utils";
import BaseUserProfile from "~/client/components/BaseUserProfile";

type UserProfileProps = {
  userId: number;
};

function UserProfile({ userId }: UserProfileProps) {
  const r = api.main.userById.useQuery({ id: userId });

  QueryError.check({
    result: r,
    fieldName: "userById"
  });

  return (
    isLoaded(r) && (
      <BaseUserProfile 
        user={r.data!} 
        showJoinedDate={true}
        size="md"
        width={600}
      />
    )
  );
}

export default function User() {
  const params = useParams<{ userId: string }>();
  const userId = strictParseInt(params.userId);
  const searchParams = useSearchParams();
  const isLocalNavBarHidden = searchParams.get("back") !== "true";

  return (
    <WithLocalNavigationHeader hidden={isLocalNavBarHidden}>
      <Center>
        <UserProfile userId={userId} />
      </Center>
    </WithLocalNavigationHeader>
  );
}
