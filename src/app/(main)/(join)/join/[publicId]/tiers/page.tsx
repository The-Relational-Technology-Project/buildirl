"use client";

import { Stack, Title, Text, useMatches, TitleOrder } from "@mantine/core";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { useMounted } from "@mantine/hooks";
import { MembershipTier } from "~/server/membershipTier/types";
import { MembershipTierCarousel } from "~/client/components/MembershipTierCarousel";

export default function ClubTiers() {
  const titleOrder = useMatches<TitleOrder>({ base: 2, md: 1 });
  const titleAndCardGap = useMatches({ base: "lg", md: "xl" });
  const mounted = useMounted();
  const router = useRouter();

  const params = useParams<{ publicId: string }>();

  const club = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });

  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });

  if (!isLoaded(club)) {
    return null;
  }

  const publishedTiers = club.data!.membershipTiers.filter(
    (t) => t.status === "PUBLISHED"
  );

  const handleTierSelect = (tier: MembershipTier) => {
    router.push(`/apply/${params.publicId}?membershipTierId=${tier.id}`);
  };

  return (
    mounted && (
      <WithLocalNavigationHeader>
        <Stack gap={titleAndCardGap}>
          <Stack align={"center"} gap={6}>
            <Title order={titleOrder}>BE A JOINER.</Title>
            <Text size={"lg"} ta="center">
              Become a contributing member.
            </Text>
          </Stack>

          <MembershipTierCarousel
            tiers={publishedTiers}
            onTierSelect={handleTierSelect}
            buttonText="Apply to Join"
          />

          <Text
            size={"sm"}
            style={{ alignSelf: "center", textAlign: "center" }}
            mb={20}
          >
            You will only be charged if you are approved as a member.
          </Text>
        </Stack>
      </WithLocalNavigationHeader>
    )
  );
}

