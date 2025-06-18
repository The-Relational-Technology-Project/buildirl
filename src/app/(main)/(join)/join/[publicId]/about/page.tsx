"use client";

import { useParams } from "next/navigation";
import { isLoaded } from "~/client/utils";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { Group, Stack, StackProps, Text, Title } from "@mantine/core";
import React from "react";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";

export default function ClubAbout() {
  const params = useParams<{ publicId: string }>();

  const club = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });
  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });

  return (
    isLoaded(club) && (
      <WithLocalNavigationHeader>
        <Stack px={{ base: 0, md: "xl" }}>
          <Title order={3}>{club.data!.name}</Title>
          {club.data!.description.length > 0 && (
            <Text
              size={"md"}
              mb={{ base: "sm", md: "lg" }}
              style={{ whiteSpace: "pre-line" }}
            >
              {club.data!.description}
            </Text>
          )}
          <ClubStatistics clubId={club.data!.id} />
        </Stack>
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
  const clubStatistics = api.main.clubStatistics.useQuery({
    clubId
  });
  QueryError.check({
    result: clubStatistics,
    fieldName: "clubStatistics"
  });

  return (
    isLoaded(clubStatistics) && (
      <Stack gap={4} {...props}>
        <Group gap={4}>
          <Text size={"md"} fw={700}>
            {clubStatistics.data!.memberCount}
          </Text>
          <Text
            size={"md"}
          >{`contributing member${clubStatistics.data!.memberCount > 1 ? "s" : ""}`}</Text>
        </Group>
      </Stack>
    )
  );
}
