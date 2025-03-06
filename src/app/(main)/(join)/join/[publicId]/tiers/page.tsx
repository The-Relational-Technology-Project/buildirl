"use client";

import {
  Stack,
  Title,
  Text,
  Space,
  Box,
  Paper,
  useMatches,
  useMantineColorScheme,
  TitleOrder
} from "@mantine/core";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { MembershipTier } from "~/server/service/types";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { Carousel } from "@mantine/carousel";
import { useMounted } from "@mantine/hooks";
import PrimaryButton from "~/client/components/PrimaryButton";

export default function ClubTiers() {
  const isMobile = useMatches({ base: true, md: false });
  const titleOrder = useMatches<TitleOrder>({ base: 2, md: 1 });
  const titleAndCardGap = useMatches({ base: "lg", md: "xl" });
  const { colorScheme } = useMantineColorScheme();
  const mounted = useMounted();

  const params = useParams<{ publicId: string }>();

  const r = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });

  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });

  if (!isLoaded(r)) {
    return null;
  }

  const publishedTiers = r.data!.membershipTiers.filter(
    (t) => t.status === "PUBLISHED"
  );

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

          <Carousel
            slideSize="33.333333%"
            slideGap="md"
            align="center"
            withControls={false}
            // we need indicators for mobile because
            // the next and previous card are not visible
            withIndicators={isMobile && publishedTiers.length > 1}
            styles={
              isMobile && publishedTiers.length > 1
                ? {
                    indicator: {
                      backgroundColor: `${colorScheme === "dark" ? "white" : "black"}`,
                      width: 8,
                      height: 8
                    }
                  }
                : undefined
            }
            // shifts the indicator down
            pb={{ base: 60, md: 0 }}
          >
            {publishedTiers.map((t) => (
              <Carousel.Slide key={t.id} py={4}>
                <MembershipTierCard
                  membershipTier={t}
                  clubPublicId={params.publicId}
                />
              </Carousel.Slide>
            ))}
          </Carousel>

          <Text
            size={"sm"}
            style={{ alignSelf: "center", textAlign: "center" }}
            c={"dimmed"}
            mb={20}
          >
            You will only be charged if you are approved as a member.
          </Text>
        </Stack>
      </WithLocalNavigationHeader>
    )
  );
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
    <Paper key={membershipTier.id} h={400} w={300} p={"lg"}>
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
            {/* It is intentional to omit dollar sign here as $ sign causes anxiety for consumers */}
            {membershipTier.costPerMonthInUSD} / month
          </Text>

          <Box style={{ alignSelf: "center" }}>
            <PrimaryButton
              size={"lg"}
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
