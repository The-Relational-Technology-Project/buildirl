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
        <Stack px={{ base: 0, md: "xl" }}>
          <Title order={3}>{r.data!.name}</Title>
          {r.data!.description.length > 0 && (
            <Text 
              size={"md"} 
              mb={{ base: "sm", md: "lg" }}
              style={{ whiteSpace: "pre-line" }}
            >
              {r.data!.description}
            </Text>
          )}
          <ClubStatistics clubId={r.data!.id} />
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
          <Text size={"md"} fw={700}>
            {r.data!.memberCount}
          </Text>
          <Text
            size={"md"}
          >{`active member${r.data!.memberCount > 1 ? "s" : ""}`}</Text>
        </Group>
      </Stack>
    )
  );
}
