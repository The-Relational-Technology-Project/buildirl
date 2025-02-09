"use client";

import { useParams } from "next/navigation";
import { strictParseInt } from "~/utils";
import { WithLocalNavigationHeader } from "~/client/components/WithLocalNavigationHeader";
import { Stack } from "@mantine/core";
import { UserProfile } from "~/app/(main)/user/_components/UserProfile";
import React from "react";
import { ApplicationResponsesSection } from "~/app/(main)/user/_components/ApplicationResponsesSection";

export default function ClubUser() {
  const params = useParams<{ userId: string; clubId: string }>();
  const userId = strictParseInt(params.userId);
  const clubId = strictParseInt(params.clubId);

  return (
    <WithLocalNavigationHeader>
      <Stack justify={"center"}>
        <UserProfile userId={userId} />
        <ApplicationResponsesSection userId={userId} clubId={clubId} />
      </Stack>
    </WithLocalNavigationHeader>
  );
}
