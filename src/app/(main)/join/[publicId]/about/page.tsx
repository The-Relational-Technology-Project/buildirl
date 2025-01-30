"use client";

import { useParams, useRouter } from "next/navigation";
import { isLoaded } from "~/client/utils";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import {
  Group,
  Stack,
  StackProps,
  Text,
  Title
} from "@mantine/core";
import React from "react";
import { WithLocalNavigationHeader } from "~/client/components/WithLocalNavigationHeader";

export default function ClubAbout() {
  const params = useParams<{ publicId: string }>();
  const router = useRouter();

  const r = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });
  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });

  return (
    isLoaded(r) && (
      <WithLocalNavigationHeader>
        <Title order={4}>{r.data!.name}</Title>
        <Text size={"md"} c={"dimmed"}>
          {r.data!.description}
        </Text>
        <ClubStatistics clubId={r.data!.id} mt={"xl"} />
      </WithLocalNavigationHeader>
    )
  );
}

type ClubStatisticsProps = {
  clubId: number;
};

function ClubStatistics({
  clubId,
  ...props
}: ClubStatisticsProps & StackProps) {
  const r = api.main.clubStatistics.useQuery({
    clubId
  });
  QueryError.check({
    result: r,
    fieldName: "clubStatistics"
  });

  return (
    isLoaded(r) && (
      <Stack gap={4} {...props}>
        <Group gap={4}>
          <Text size={"sm"} fw={500}>
            {r.data!.memberCount}
          </Text>
          <Text
            size={"sm"}
          >{`active member${r.data!.memberCount > 1 ? "s" : ""}`}</Text>
        </Group>
        <Group gap={4}>
          <Text size={"sm"} fw={500}>
            {r.data!.pendingMembershipApplications}
          </Text>
          <Text size={"sm"}>applied</Text>
        </Group>
      </Stack>
    )
  );
}
