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
  Title,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { Club } from "~/server/club/types";
import {
  ActiveMembershipCampaignProgress,
  CampaignBudgetItem,
  MembershipCampaign
} from "~/server/membershipCampaign/types";
import {
  getAvatarEmoji,
  getDaysLeftColor,
  getLowestPaidMembershipTier,
  getProgressBarColor
} from "../utils";
import { JoinButton } from "./JoinButton";

type CampaignModuleProps = {
  club: Club;
  activeCampaign: MembershipCampaign;
  campaignProgress: ActiveMembershipCampaignProgress;
};

type BudgetItemCardProps = Readonly<
  Pick<CampaignBudgetItem, "label" | "costPerMonthInUSD">
>;
type CommittedMember = Pick<
  ActiveMembershipCampaignProgress["committedMembers"][number],
  "id" | "firstName"
>;

export function CampaignModule({
  club,
  activeCampaign,
  campaignProgress
}: CampaignModuleProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const borderRadius = 15;
  const cardBorder = "2px solid #000";
  const cardShadow = "6px 6px 0px #000";
  const innerCardRadius = 12;
  const sectionBackground =
    colorScheme === "dark" ? theme.colors.dark![3] : theme.colors.beige![1];
  const innerCardBackground =
    colorScheme === "dark" ? theme.colors.dark![5] : "#ffffff";

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

  const memberSlotCount = activeCampaign.budgetItems.length * 4;

  const shouldCapCommittedMembers =
    memberSlotCount > 0 && totalCommittedMembers > memberSlotCount;

  const visibleMemberLimit = shouldCapCommittedMembers
    ? Math.max(memberSlotCount - 1, 0)
    : memberSlotCount === 0
      ? totalCommittedMembers
      : Math.min(totalCommittedMembers, memberSlotCount);

  const committedMembersToDisplay: CommittedMember[] =
    campaignProgress.committedMembers.slice(0, visibleMemberLimit);

  const lowestMembershipPrice = getLowestPaidMembershipTier(club);

  const remainingCommittedMembers =
    totalCommittedMembers - committedMembersToDisplay.length;

  const totalMonthlyCosts = activeCampaign.budgetItems.reduce((total, item) => {
    return total + item.costPerMonthInUSD;
  }, 0);

  function BudgetItemCard({ costPerMonthInUSD, label }: BudgetItemCardProps) {
    return (
      <Card
        style={{
          boxShadow: "none",
          border: cardBorder,
          borderRadius: innerCardRadius,
          paddingTop: "6px",
          paddingBottom: "6px",
          backgroundColor: innerCardBackground
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
      <Center mt={-24}>
        <Box
          bg="yellow"
          px={36}
          py={8}
          bdrs={99}
          bd={cardBorder}
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
        p="32px 24px"
        ta={"center"}
        style={{
          border: cardBorder,
          borderRadius,
          boxShadow: cardShadow,
          backgroundColor: sectionBackground
        }}
      >
        <Title
          order={2}
          tt="uppercase"
          ta="center"
          style={{
            fontFamily: club.themeHeadingFont ?? "inherit"
          }}
        >
          {`Back this Club. Become a Member.`}
        </Title>

        <Text size={"sm"}>
          Help this club reach its campaign goal! Join as a contributing member
          to keep this club alive.
        </Text>

        <Stack py={{ base: 8, sm: 16 }}>
          <Box pos="relative" h={{ base: 280, sm: 200 }}>
            <Box
              pos="absolute"
              left={{ base: "calc(50% - 130px)", sm: 52 }}
              top={{ base: 40, sm: "50%" }}
              mt={{ base: 20, sm: "0" }}
              style={{
                transform: "translateY(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
              bg={colorScheme === "dark" ? theme.colors.dark![1] : "gray.1"}
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
              <Text
                size={"xs"}
                c={colorScheme === "dark" ? theme.colors.dark![2] : "dimmed"}
                tt="uppercase"
                fw={600}
              >
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
                emptySegmentColor={
                  colorScheme === "dark" ? theme.colors.dark![2] : "gray.2"
                }
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
                      {`${remainingMembershipsNeeded} to go`}
                    </Text>
                    <Text component="span" size={"sm"} fw={500}>
                      to hit {activeCampaign.targetNumberOfMemberships} member
                      goal
                    </Text>
                  </Stack>
                }
              />
            </Center>

            <Box
              pos="absolute"
              right={{ base: "calc(50% - 130px)", sm: 52 }}
              top={{ base: 40, sm: "50%" }}
              mt={{ base: 20, sm: "0" }}
              style={{
                transform: "translateY(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
              bg={colorScheme === "dark" ? theme.colors.dark![1] : "gray.1"}
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
              <Text size={"xs"} c="dimmed" tt="uppercase" fw={600}>
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
            <Title
              order={4}
              style={{
                fontFamily: club.themeHeadingFont ?? "inherit"
              }}
            >
              Ongoing Club Costs
            </Title>
            <Text size={"xs"} ta={"center"}>
              This is what it takes to keep our lights on.
            </Text>
            <Stack gap={8} mt={12}>
              <Card
                style={{
                  boxShadow: "none",
                  border: cardBorder,
                  borderRadius: innerCardRadius,
                  backgroundColor: innerCardBackground
                }}
              >
                <Stack justify="center" gap={8}>
                  <Text size={"md"}>Total Club Expenses:</Text>
                  <Group gap={4} justify="center" align="baseline">
                    <Text size="2rem" fw="600">
                      {`$` + totalMonthlyCosts}
                    </Text>
                    <Text size="sm" c="gray" fw="600">
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
          <Box bg="#000" w={2} />

          <Stack flex={1} h="100%" gap={4} justify="start">
            <Title
              order={4}
              style={{
                fontFamily: club.themeHeadingFont ?? "inherit"
              }}
            >
              Each member contributes
            </Title>
            <Text size={"xs"} ta={"center"}>
              to keep the club thriving!
            </Text>
            <Stack gap={8} mt={12}>
              <Card
                style={{
                  boxShadow: "none",
                  border: cardBorder,
                  borderRadius: innerCardRadius,
                  backgroundColor: innerCardBackground
                }}
              >
                <Stack justify="center" gap={8}>
                  <Text size={"md"}>Starting at:</Text>
                  <Group gap={4} justify="center" align="baseline">
                    <Text size="2rem" fw="600">
                      {`$` + lowestMembershipPrice}
                    </Text>
                    <Text size="sm" c="gray" fw="600">
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
                        bd={cardBorder}
                        bg={innerCardBackground}
                        bdrs={10}
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
                  <Grid.Col key={"more-members"} span={3}>
                    <Stack
                      bdrs={10}
                      bd={cardBorder}
                      bg={innerCardBackground}
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
