import { api } from "~/trpc/react";
import {
  Badge,
  Group,
  Paper,
  Stack,
  Title,
  Text,
  Button,
  ActionIcon,
  Space,
  Box
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { Club, MembershipTier } from "~/server/service/types";
import React from "react";
import { AlertMessage } from "~/client/components/AlertMessage";
import { useDisclosure } from "@mantine/hooks";
import { CreateMembershipTierModal } from "~/client/components/CreateMembershipTierModal";
import { UpdateMembershipTierModal } from "~/client/components/UpdateMembershipTierModal";

type MembershipsPanelProps = {
  club: Club;
};

export function MembershipTiersPanel({ club }: MembershipsPanelProps) {
  const [opened, { open, close }] = useDisclosure(false);

  const publishedTiers = club.membershipTiers.filter(
    (tier) => tier.status === "PUBLISHED"
  );
  const unpublishedTiers = club.membershipTiers.filter(
    (tier) => tier.status === "UNPUBLISHED"
  );

  return (
    <Stack mt={"lg"} pb={"xl"}>
      <Title order={4}>Active Tiers</Title>

      <Box style={{ overflowX: "auto" }}>
        <Group wrap="nowrap" style={{ minWidth: "min-content" }}>
          {publishedTiers.map((t) => (
            <MembershipTierCard key={t.id} club={club} membershipTier={t} />
          ))}

          <ActionIcon
            variant="light"
            color={"black"}
            onClick={open}
            w={300}
            h={400}
          >
            <IconPlus />
          </ActionIcon>
        </Group>
      </Box>

      <CreateMembershipTierModal
        club={club}
        opened={opened}
        handleClose={close}
      />

      {unpublishedTiers.length !== 0 && (
        <Stack>
          <Title order={4} mt="xl">
            Inactive Tiers
          </Title>
          <Box style={{ overflowX: "auto" }}>
            <Group wrap="nowrap" style={{ minWidth: "min-content" }}>
              {unpublishedTiers.map((t) => (
                <MembershipTierCard key={t.id} club={club} membershipTier={t} />
              ))}
            </Group>
          </Box>
        </Stack>
      )}
    </Stack>
  );
}

type MembershipTierCardProps = {
  club: Club;
  membershipTier: MembershipTier;
};

export function MembershipTierCard({
  club,
  membershipTier
}: MembershipTierCardProps) {
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
        {membershipTier.status === "PUBLISHED" ? (
          <Badge color="green" style={{ alignSelf: "flex-end" }}>
            Active
          </Badge>
        ) : (
          <Badge color="red" style={{ alignSelf: "flex-end" }}>
            Inactive
          </Badge>
        )}

        <Title order={4} mt={4}>
          {membershipTier.name}
        </Title>

        <Stack gap={4}>
          <Title order={6}>Contributions</Title>
          {membershipTier.contributionDescription === "" ? (
            <Box mb={50}>
              <AlertMessage
                message={"Please update contribution details."}
                size={"sm"}
              />
            </Box>
          ) : (
            <Text size={"sm"} c="dimmed" lineClamp={4}>
              {membershipTier.contributionDescription}
            </Text>
          )}
        </Stack>

        <Stack gap={4} mt={4}>
          <Title order={6}>Benefits</Title>
          {membershipTier.benefitDescription === "" ? (
            <AlertMessage
              message={"Please update benefits details."}
              size={"sm"}
            />
          ) : (
            <Text size={"sm"} c="dimmed" lineClamp={4}>
              {membershipTier.benefitDescription}
            </Text>
          )}
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
            opened={opened}
            handleClose={close}
          />

          {membershipTier.status === "PUBLISHED" ? (
            <Button
              variant="light"
              onClick={async () =>
                await unpublishMembershipTier.mutateAsync({
                  id: membershipTier.id
                })
              }
              loading={unpublishMembershipTier.isPending}
            >
              Archive
            </Button>
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
