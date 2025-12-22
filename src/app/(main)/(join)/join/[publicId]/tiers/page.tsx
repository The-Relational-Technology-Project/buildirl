"use client";

import {
  Stack,
  Title,
  Text,
  useMatches,
  TitleOrder,
  Paper
} from "@mantine/core";
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
          <Stack align={"center"} gap={6} mb={"md"}>
            <Title ta="center" order={titleOrder}>
              Help keep this community alive!
            </Title>
            <Paper
              p="xs"
              radius="xs"
              shadow="none"
              style={{
                backgroundColor: "white",
                border: "2px solid #0f0f0f",
                boxShadow: "4px 6px 0 #0f0f0f",
                transform: "rotate(-2deg)",
                maxWidth: 500,
                marginTop: "12px"
              }}
            >
              <Text size="md" fw={500} ta="center" px="md" lh={1}>
                ✨ A little contribution, a big difference. ✨
              </Text>
            </Paper>
          </Stack>

          <MembershipTierCarousel
            tiers={publishedTiers}
            onTierSelect={handleTierSelect}
            buttonText="Select"
          />

          <Text
            size={"sm"}
            style={{ alignSelf: "center", textAlign: "center" }}
            mb={20}
          >
            You’ll only be charged if your application is approved by the club.
            You may also withdraw your application after submitting.
          </Text>
        </Stack>
      </WithLocalNavigationHeader>
    )
  );
}
