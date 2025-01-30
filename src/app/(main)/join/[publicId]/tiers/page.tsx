"use client";

import {
  Stack,
  Title,
  Text,
  Button,
  Card,
  Group,
  Box,
  Space
} from "@mantine/core";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { MembershipTier } from "~/server/service/types";

export default function ClubTiers() {
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
      <Stack py="xl" gap={"xl"}>
        <Stack align={"center"} gap={"xs"}>
          <Title order={2}>BE A JOINER.</Title>
          <Text c="dimmed" ta="center">
            Become a contributing member
          </Text>
        </Stack>

        <Box style={{ overflowX: "auto" }}>
          <Group wrap="nowrap" style={{ minWidth: "min-content" }}>
            {r
              .data!.membershipTiers.filter((t) => t.status === "PUBLISHED")
              .map((t) => (
                <MembershipTierCard
                  key={t.id}
                  membershipTier={t}
                  clubPublicId={params.publicId}
                />
              ))}
          </Group>
        </Box>
      </Stack>
    )
  );
}

type MembershipTierCardProps = {
  clubPublicId: string;
  membershipTier: MembershipTier;
};

export function MembershipTierCard({
  membershipTier,
  clubPublicId
}: MembershipTierCardProps) {
  const router = useRouter();
  return (
    <Card key={membershipTier.id} w={300} h={500} p={"xl"} withBorder>
      <Stack h={"100%"} gap={10}>
        <Title order={3}>{membershipTier.name}</Title>

        {membershipTier.benefitDescription !== "" && (
          <Stack gap={0}>
            <Title order={6}>Our member experience</Title>
            <Text size="sm">{membershipTier.benefitDescription}</Text>
          </Stack>
        )}

        {membershipTier.contributionDescription !== "" && (
          <Stack gap={0} mt={"md"}>
            <Title order={6}>Your contribution is key!</Title>
            <Text size="sm">{membershipTier.contributionDescription}</Text>
          </Stack>
        )}

        <Space flex={1} />

        <Text size="xl" fw={500}>
          ${membershipTier.costPerMonthInUSD} / month
        </Text>

        <Button
          variant="filled"
          color={"violet"}
          onClick={() =>
            router.push(
              `/join/${clubPublicId}/apply?membershipTierId=${membershipTier.id}`
            )
          }
        >
          Apply to Join
        </Button>
      </Stack>
    </Card>
  );
}
