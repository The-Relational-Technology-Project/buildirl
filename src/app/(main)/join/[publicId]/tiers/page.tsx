"use client";

import { Stack, Title, Text, Button, Card, Space } from "@mantine/core";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { MembershipTier } from "~/server/service/types";
import { WithLocalNavigationHeader } from "~/client/components/WithLocalNavigationHeader";
import { Carousel } from "@mantine/carousel";

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
      <WithLocalNavigationHeader>
        <Stack gap={"xl"}>
          <Stack align={"center"} gap={"xs"}>
            <Title order={2}>BE A JOINER.</Title>
            <Text c="dimmed" ta="center">
              Become a contributing member
            </Text>
          </Stack>

          <Carousel
            slideSize="33.333333%"
            slideGap="md"
            align="center"
            withControls={false}
          >
            {r
              .data!.membershipTiers.filter((t) => t.status === "PUBLISHED")
              .map((t) => (
                <Carousel.Slide key={t.id}>
                  <MembershipTierCard
                    membershipTier={t}
                    clubPublicId={params.publicId}
                  />
                </Carousel.Slide>
              ))}
          </Carousel>
        </Stack>
      </WithLocalNavigationHeader>
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

        <Stack>
          {membershipTier.benefitDescription !== "" && (
            <Stack gap={0}>
              <Title order={6}>Our member experience</Title>
              <Text size="sm">{membershipTier.benefitDescription}</Text>
            </Stack>
          )}

          {membershipTier.contributionDescription !== "" && (
            <Stack gap={0}>
              <Title order={6}>Your contribution is key!</Title>
              <Text size="sm">{membershipTier.contributionDescription}</Text>
            </Stack>
          )}
        </Stack>

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
