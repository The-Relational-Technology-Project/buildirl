import {
  Anchor,
  Box,
  Card,
  Center,
  Flex,
  Grid,
  Group,
  SemiCircleProgress,
  Stack,
  Text,
  Title
} from "@mantine/core";
import { Club } from "~/server/club/types";
import {
  ActiveMembershipCampaignProgress,
  MembershipCampaign
} from "~/server/membershipCampaign/types";
import {
  getAvatarEmoji,
  getDaysLeftColor,
  getLowestPaidMembershipTier,
  getProgressBarColor
} from "../utils";
import { JoinButton } from "../page";

type CampaignModuleProps = {
  club: Club;
  activeCampaign: MembershipCampaign;
  campaignProgress: ActiveMembershipCampaignProgress;
};

export function CampaignModule({
  club,
  activeCampaign,
  campaignProgress
}: CampaignModuleProps) {
  const daysLeft = Math.ceil(
    (activeCampaign.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const progressPercentage =
    (campaignProgress.committedNumberOfMemberships /
      activeCampaign.targetNumberOfMemberships) *
    100;

  const remainingMembershipsNeeded = Math.max(
    0,
    activeCampaign.targetNumberOfMemberships -
      campaignProgress.committedNumberOfMemberships
  );

  const totalCommittedMembers = campaignProgress.committedMembers.length;

  const memberSlotCount = activeCampaign.budgetItems.length * 3;

  const shouldCapCommittedMembers =
    memberSlotCount > 0 && totalCommittedMembers > memberSlotCount;

  const visibleMemberLimit = shouldCapCommittedMembers
    ? Math.max(memberSlotCount - 1, 0)
    : memberSlotCount === 0
      ? totalCommittedMembers
      : Math.min(totalCommittedMembers, memberSlotCount);

  const committedMembersToDisplay = campaignProgress.committedMembers.slice(
    0,
    visibleMemberLimit
  );

  const lowestMembershipPrice = getLowestPaidMembershipTier(club);

  const remainingCommittedMembers =
    totalCommittedMembers - committedMembersToDisplay.length;

  const totalMonthlyCosts = activeCampaign.budgetItems.reduce((total, item) => {
    return total + item.costPerMonthInUSD;
  }, 0);

  function BudgetItemCard({
    costPerMonthInUSD,
    label
  }: {
    costPerMonthInUSD: number;
    label: string;
  }) {
    return (
      <Card
        style={{
          boxShadow: "none",
          border: "1px solid gray",
          paddingTop: "6px",
          paddingBottom: "6px"
        }}
      >
        <Group justify="space-between">
          <Text>{label}</Text>
          <Text>{`$` + costPerMonthInUSD}</Text>
        </Group>
      </Card>
    );
  }

  return (
    <>
      <Center mt={-16}>
        <Box
          bg="yellow"
          px={36}
          py={8}
          bdrs={99}
          tt="uppercase"
          pos="relative"
          top={30}
          w="fit-content"
        >
          <Text fw={600} c="#5c4518">
            ✨ Live member campaign ✨
          </Text>
        </Box>
      </Center>

      <Stack
        gap={4}
        mb={{ base: "sm", md: "lg" }}
        p={28}
        ta={"center"}
        style={{
          borderRadius: 4,
          padding: "16px",
          paddingVertical: "28",
          backgroundColor: "ivory",
          fontFamily: club.themeHeadingFont ?? "inherit"
        }}
      >
        <Title
          order={2}
          tt="uppercase"
        >{`Back this Club. Become a Member.`}</Title>

        <Text size={"sm"}>
          Help this club reach its campaign goal! Join as a contributing member
          to keep this club alive.
        </Text>

        <Stack py={{ base: 8, sm: 16 }}>
          <Box pos="relative" h={{ base: 280, sm: 200 }}>
            <Box
              pos="absolute"
              left={{ base: "calc(50% - 130px)", sm: 96 }}
              top={{ base: 40, sm: "50%" }}
              mt={{ base: 20, sm: "0" }}
              style={{
                transform: "translateY(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
              bg="gray.1"
              w={90}
              h={90}
              bdrs={50}
            >
              <Text
                size={"2rem"}
                fw={700}
                lh={1}
                c={getDaysLeftColor(daysLeft)}
              >
                {daysLeft}
              </Text>
              <Text size={"xs"} c="dimmed" tt="uppercase" fw={500}>
                day{daysLeft > 1 ? "s" : ""} left
              </Text>
            </Box>

            <Center h={{ base: "60%", sm: "100%" }} mt={{ base: 100, sm: 0 }}>
              <SemiCircleProgress
                fillDirection="left-to-right"
                orientation="up"
                size={300}
                thickness={16}
                value={progressPercentage}
                filledSegmentColor={getProgressBarColor(
                  remainingMembershipsNeeded
                )}
                label={
                  <Stack
                    component="span"
                    gap={0}
                    mx={16}
                    align="center"
                    style={{ display: "inline-flex" }}
                  >
                    <Text
                      component="span"
                      size={"2rem"}
                      fw={700}
                      c={getProgressBarColor(remainingMembershipsNeeded)}
                    >
                      {`${remainingMembershipsNeeded} more`}
                    </Text>
                    <Text component="span" size={"sm"}>
                      to hit {activeCampaign.targetNumberOfMemberships} member
                      goal
                    </Text>
                  </Stack>
                }
              />
            </Center>

            <Box
              pos="absolute"
              right={{ base: "calc(50% - 130px)", sm: 96 }}
              top={{ base: 40, sm: "50%" }}
              mt={{ base: 20, sm: "0" }}
              style={{
                transform: "translateY(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
              bg="gray.1"
              w={90}
              h={90}
              bdrs={50}
            >
              <Text
                size={"2rem"}
                fw={700}
                lh={1}
                c={getProgressBarColor(remainingMembershipsNeeded)}
              >
                {totalCommittedMembers}
              </Text>
              <Text size={"xs"} c="dimmed" tt="uppercase" fw={500}>
                backers
              </Text>
            </Box>
          </Box>
        </Stack>

        <Box w={"100%"} pt={16}>
          <JoinButton club={club} />
        </Box>

        <Flex
          flex={1}
          align="stretch"
          direction={{ base: "column", sm: "row" }}
          gap={{ base: "md", sm: 28 }}
          pt={28}
        >
          <Stack flex={1} h="100%" gap={4}>
            <Title order={4}>Ongoing Club Costs</Title>
            <Text size={"xs"} ta={"center"}>
              This is what it takes to keep our lights on.
            </Text>
            <Stack gap={8} mt={12}>
              <Card
                style={{
                  boxShadow: "none",
                  border: "1px solid gray"
                }}
              >
                <Stack justify="center" gap={8}>
                  <Text size={"md"}>Total Club Expenses:</Text>
                  <Group gap={4} justify="center" align="baseline">
                    <Text size="2rem">{`$` + totalMonthlyCosts}</Text>
                    <Text size="sm" c="gray">
                      /month
                    </Text>
                  </Group>
                </Stack>
              </Card>
              <Text size={"xs"} ta={"center"} mt={16}>
                Estimated cost breakdown
              </Text>
              {activeCampaign.budgetItems.map((i) => {
                return (
                  <BudgetItemCard
                    costPerMonthInUSD={i.costPerMonthInUSD}
                    label={i.label}
                    key={i.label}
                  />
                );
              })}
            </Stack>
          </Stack>
          <Box bg={"lightgray"} w={1.5} />

          <Stack flex={1} h="100%" gap={4} justify="start">
            <Title order={4}>Each member contributes</Title>
            <Text size={"xs"} ta={"center"}>
              to keep the club thriving!
            </Text>
            <Stack gap={8} mt={12}>
              <Card
                style={{
                  boxShadow: "none",
                  border: "1px solid gray"
                }}
              >
                <Stack justify="center" gap={8}>
                  <Text size={"md"}>Starting at:</Text>
                  <Group gap={4} justify="center" align="baseline">
                    <Text size="2rem">{`$` + lowestMembershipPrice}</Text>
                    <Text size="sm" c="gray">
                      /month
                    </Text>
                  </Group>
                </Stack>
              </Card>
            </Stack>
            <Stack gap={8} mt={20}>
              <Text size={"xs"} ta={"center"}>
                Join the others in supporting the club campaign.
              </Text>
              <Grid gutter="8" flex={1} justify="center">
                {committedMembersToDisplay.map((member) => {
                  return (
                    <Grid.Col key={member.id} span={3}>
                      <Stack
                        bd={"1px solid gray"}
                        bg={"white"}
                        bdrs={5}
                        px={2}
                        py={8}
                        gap={2}
                      >
                        <Text>{getAvatarEmoji()}</Text>
                        <Text size={"xs"}>{member.firstName}</Text>
                      </Stack>
                    </Grid.Col>
                  );
                })}
                {!committedMembersToDisplay.length && (
                  <Text size={"xs"} c="gray.5" mt={{ base: 16, small: 32 }}>
                    Be the first to support!
                  </Text>
                )}
                {shouldCapCommittedMembers && remainingCommittedMembers > 0 && (
                  <Grid.Col key={"more-members"} span={4}>
                    <Stack
                      bdrs={5}
                      bd={"1px solid gray"}
                      bg={"white"}
                      px={4}
                      py={10}
                      gap={0}
                      align="center"
                      justify="center"
                    >
                      <Group gap={2}>
                        <Text fw={"500"}>+</Text>
                        <Text fw={"500"}>{remainingCommittedMembers}</Text>
                      </Group>
                      <Text size="xs" fw={"500"}>
                        {"more"}
                      </Text>
                    </Stack>
                  </Grid.Col>
                )}
              </Grid>
            </Stack>
          </Stack>
        </Flex>
        <Text size="xs" pt={28}>
          ❤️ Campaign ends{" "}
          {activeCampaign.targetDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric"
          })}{" "}
          @{" "}
          {activeCampaign.targetDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          })}
          . Apply to join before it ends! Final membership subject to mutual
          fit.{" "}
          <Anchor href="#how-campaign-works" size="xs">
            Learn more about how campaigns work.
          </Anchor>
        </Text>
      </Stack>
    </>
  );
}
