import {
  Box,
  Card,
  Flex,
  Grid,
  Group,
  Progress,
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
  getProgressBarColor
} from "../utils";

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

  const remainingCommittedMembers =
    totalCommittedMembers - committedMembersToDisplay.length;

  function BudgetItemCard({
    costPerMonthInUSD,
    label
  }: {
    costPerMonthInUSD: number;
    label: string;
  }) {
    return (
      <Card style={{ boxShadow: "none", border: "1px solid gray" }}>
        <Group justify="space-between">
          <Text>{label}</Text>
          <Text>{`$` + costPerMonthInUSD}</Text>
        </Group>
      </Card>
    );
  }

  return (
    <Stack
      gap={8}
      mb={{ base: "sm", md: "lg" }}
      p={28}
      ta={"center"}
      style={{
        border: "1.5px solid black",
        borderRadius: 4,
        padding: "16px",
        backgroundColor: "ivory",
        fontFamily: club.themeHeadingFont ?? "inherit"
      }}
    >
      <Title order={2}>Join as a Founding Member!</Title>

      <Stack mt={16}>
        <Group flex={1} justify={"space-between"} px={{ base: 16, sm: 125 }}>
          <Stack gap={2}>
            <Text size={"3rem"} fw={700} c={getDaysLeftColor(daysLeft)}>
              {daysLeft}
            </Text>
            <Text size={"sm"}>more days left</Text>
          </Stack>
          <Stack gap={2}>
            <Text size={"3rem"} fw={700} c={"lilac"}>
              {remainingMembershipsNeeded}
            </Text>
            <Text size={"sm"}>
              more {remainingMembershipsNeeded > 1 ? "people" : "person"} to go
            </Text>
          </Stack>
        </Group>
        <Progress
          value={progressPercentage}
          size="xl"
          color={getProgressBarColor(remainingMembershipsNeeded)}
          bg="gray.2"
        />
        <Text size={"md"}>
          {totalCommittedMembers} members committed of{" "}
          {activeCampaign.targetNumberOfMemberships} member goal
        </Text>
      </Stack>

      <Flex
        flex={1}
        align="stretch"
        direction={{ base: "column", sm: "row" }}
        gap={{ base: "md", sm: 28 }}
        pt={28}
      >
        <Stack flex={1} h="100%" gap={4}>
          <Title order={4}>Monthly $ Needs</Title>
          <Text size={"xs"} ta={"center"}>
            This is what it takes to keep our lights on.
          </Text>
          <Stack gap={8} mt={12}>
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
        <Stack flex={1} justify="start" gap={4}>
          <Title order={4}>Supporting Members</Title>
          <Text size={"xs"} ta={"center"}>
            Join the others in supporting the club campaign.
          </Text>
          <Grid gutter="sm" mt={12} flex={1} justify="center">
            {committedMembersToDisplay.map((member) => {
              return (
                <Grid.Col key={member.id} span={4}>
                  <Stack
                    bd={"1px solid gray"}
                    bg={"white"}
                    bdrs={5}
                    px={4}
                    py={8}
                    gap={2}
                  >
                    <Text>{getAvatarEmoji()}</Text>
                    <Text size={"xs"}>{member.firstName}</Text>
                  </Stack>
                </Grid.Col>
              );
            })}
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
          <Stack gap={4} mt={4}>
            <Text size={"xs"} ta={"center"} c={"gray"} pt={{ base: 8, sm: 0 }}>
              *Final membership subject to mutual fit.
            </Text>
          </Stack>
        </Stack>
      </Flex>
      <Text size="xs" pt={28}>
        ❤️ All-or-Nothing: This membership only launches if it hits its goal by
        Wednesday, August 20, 2025 at 11:59 PM PDT. Join to make it happen!
      </Text>
    </Stack>
  );
}
