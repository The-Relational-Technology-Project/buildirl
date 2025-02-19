import { api } from "~/trpc/react";
import {
  Badge,
  Group,
  Paper,
  Stack,
  Title,
  Text,
  Button,
  Space,
  Box,
  Tooltip,
  Center
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { Club, MembershipTier } from "~/server/service/types";
import React from "react";
import AlertMessage from "~/client/components/AlertMessage";
import { useDisclosure } from "@mantine/hooks";
import CreateMembershipTierModal from "~/app/(main)/club/[clubId]/manage/_components/CreateMembershipTierModal";
import UpdateMembershipTierModal from "~/app/(main)/club/[clubId]/manage/_components/UpdateMembershipTierModal";
import { Carousel } from "@mantine/carousel";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";

type ManageMembershipsPanelProps = {
  club: Club;
};

export default function ManageMembershipTiersPanel({
  club
}: ManageMembershipsPanelProps) {
  const [opened, { open, close }] = useDisclosure(false);

  const publishedTiers = club.membershipTiers.filter(
    (tier) => tier.status === "PUBLISHED"
  );
  const unpublishedTiers = club.membershipTiers.filter(
    (tier) => tier.status === "UNPUBLISHED"
  );

  return (
    <Stack mt={"lg"} pb={"xl"} gap={"sm"}>
      <Title order={4}>Active Tiers</Title>

      <Carousel
        slideSize="33.333333%"
        slideGap="md"
        align="start"
        withControls={false}
      >
        {publishedTiers.map((t) => (
          <Carousel.Slide key={t.id} py={4}>
            <ManageMembershipTierCard
              club={club}
              membershipTier={t}
              // a trick because we know this is only true if there is
              // only 1 remaining published tier and if so this must be
              // that tier
              isLastPublished={publishedTiers.length === 1}
            />
          </Carousel.Slide>
        ))}

        <Carousel.Slide py={4}>
          <Paper w={300} h={400}>
            <Center h={"100%"}>
              <ColorSchemeAwareActionIcon variant="transparent" onClick={open}>
                <IconPlus />
              </ColorSchemeAwareActionIcon>
            </Center>
          </Paper>
        </Carousel.Slide>
      </Carousel>

      <CreateMembershipTierModal
        club={club}
        opened={opened}
        handleClose={close}
      />

      {unpublishedTiers.length !== 0 && (
        <Stack gap={"sm"}>
          <Title order={4} mt="md">
            Inactive Tiers
          </Title>

          <Carousel
            slideSize="33.333333%"
            slideGap="md"
            align="start"
            withControls={false}
          >
            {unpublishedTiers.map((t) => (
              <Carousel.Slide key={t.id} p={4}>
                <ManageMembershipTierCard
                  club={club}
                  membershipTier={t}
                  // not published!
                  isLastPublished={false}
                />
              </Carousel.Slide>
            ))}
          </Carousel>
        </Stack>
      )}
    </Stack>
  );
}

type ManageMembershipTierCardProps = {
  club: Club;
  membershipTier: MembershipTier;
  isLastPublished: boolean;
};

export function ManageMembershipTierCard({
  club,
  membershipTier,
  isLastPublished
}: ManageMembershipTierCardProps) {
  const [opened, { open, close }] = useDisclosure(false);

  const utils = api.useUtils();

  const publishMembershipTier = api.main.publishMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: club.id });
      utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
      utils.main.userOwnedClubs.invalidate();
    }
  });
  const unpublishMembershipTier = api.main.unpublishMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: club.id });
      utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
      utils.main.userOwnedClubs.invalidate();
    }
  });

  return (
    <Paper key={membershipTier.id} p="md" withBorder h={400} w={300}>
      <Stack h="100%" gap={4}>
        <Box style={{ alignSelf: "flex-end" }}>
          {membershipTier.status === "PUBLISHED" ? (
            <Badge color="green">Active</Badge>
          ) : (
            <Badge color="red">Inactive</Badge>
          )}
        </Box>

        <Title order={4} mt={4}>
          {membershipTier.name}
        </Title>

        <Stack style={{ overflowY: "auto" }}>
          <Stack gap={4}>
            <Title order={6}>Contributions</Title>
            <Box mih={70}>
              {membershipTier.contributionDescription === "" ? (
                <AlertMessage
                  message={"Please update contribution details."}
                  size={"sm"}
                />
              ) : (
                <Text size={"sm"} c="dimmed">
                  {membershipTier.contributionDescription}
                </Text>
              )}
            </Box>
          </Stack>

          <Stack gap={4} mt={4}>
            <Title order={6}>Benefits</Title>
            <Box mih={70}>
              {membershipTier.benefitDescription === "" ? (
                <AlertMessage
                  message={"Please update benefits details."}
                  size={"sm"}
                />
              ) : (
                <Text size={"sm"} c="dimmed">
                  {membershipTier.benefitDescription}
                </Text>
              )}
            </Box>
          </Stack>
        </Stack>

        <Space flex={1} />

        <Text fw={700} size={"md"} mb={"sm"}>
          ${membershipTier.costPerMonthInUSD}/month
        </Text>

        <Group
          style={{
            alignSelf: "flex-end"
          }}
        >
          <Button onClick={open}>Review</Button>

          <UpdateMembershipTierModal
            club={club}
            membershipTier={membershipTier}
            isLastPublished={isLastPublished}
            opened={opened}
            handleClose={close}
          />

          {membershipTier.status === "PUBLISHED" ? (
            <Tooltip
              position={"bottom"}
              label={"There must be at least one active published tier."}
              hidden={!isLastPublished}
            >
              <Button
                variant="light"
                onClick={async () =>
                  await unpublishMembershipTier.mutateAsync({
                    id: membershipTier.id
                  })
                }
                loading={unpublishMembershipTier.isPending}
                disabled={isLastPublished}
              >
                Archive
              </Button>
            </Tooltip>
          ) : (
            <Button
              variant="light"
              onClick={async () =>
                await publishMembershipTier.mutateAsync({
                  id: membershipTier.id
                })
              }
              loading={publishMembershipTier.isPending}
            >
              Publish
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}
