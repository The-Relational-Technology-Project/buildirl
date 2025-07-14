"use client";

import {
  Stack,
  Title,
  Text,
  useMatches,
  TitleOrder
} from "@mantine/core";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { useMounted } from "@mantine/hooks";
import PrimaryButton from "~/client/components/PrimaryButton";
import { billingIntervalLabel } from "~/client/utils";
import { MembershipTierCarousel } from "~/components/membership/MembershipTierCarousel";
import { MembershipTier } from "~/server/membershipTier/types";

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
            buttonColor="lilac"
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

// It is intentional to omit dollar sign here as $ sign causes anxiety for consumers
function costDisplayText(membershipTier: MembershipTier) {
  const cost = membershipTier.costPerBillingInterval;
  const interval = billingIntervalLabel(membershipTier.billingInterval);
  const initiationFee = membershipTier.initiationFeeCostInUSD;

  let text = `${cost} / ${interval}`;
  if (initiationFee !== null && initiationFee > 0) {
    text += ` + ${initiationFee} initiation`;
  }
  return text;
}

type MembershipTierCardProps = {
  clubPublicId: string;
  membershipTier: MembershipTier;
};

function MembershipTierCard({
  membershipTier,
  clubPublicId
}: MembershipTierCardProps) {
  const router = useRouter();
  return (
    <Paper key={membershipTier.id} h={425} w={300} p={"lg"}>
      <Stack h={"100%"} gap={10}>
        <Title order={3}>{membershipTier.name}</Title>

        <Stack style={{ overflowY: "auto" }}>
          {membershipTier.benefitDescription !== "" && (
            <Stack gap={4}>
              <Title order={6}>Our member experience</Title>
              <Box mih={72}>
                <Text size="sm">{membershipTier.benefitDescription}</Text>
              </Box>
            </Stack>
          )}

          {membershipTier.contributionDescription !== "" && (
            <Stack gap={4}>
              <Title order={6}>Your contribution is key!</Title>
              <Box mih={72}>
                <Text size="sm">{membershipTier.contributionDescription}</Text>
              </Box>
            </Stack>
          )}
        </Stack>

        <Space flex={1} />

        <Stack>
          <Text size="lg" fw={500}>
            {costDisplayText(membershipTier)}
          </Text>

          <Box style={{ alignSelf: "center" }}>
            <PrimaryButton
              size={"lg"}
              w={200}
              color={"lilac"}
              onClick={() =>
                router.push(
                  `/apply/${clubPublicId}?membershipTierId=${membershipTier.id}`
                )
              }
            >
              Apply to Join
            </PrimaryButton>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
