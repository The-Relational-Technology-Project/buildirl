import React, { useState } from "react";
import {
  Box,
  Card,
  Stack,
  Title,
  Text,
  Button,
  Group,
  Badge,
  Progress,
  Divider
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconTargetArrow,
  IconCurrencyDollar,
  IconUsers
} from "@tabler/icons-react";
import { Club } from "~/server/club/types";
import { api } from "~/trpc/react";
import { handleDefaultMutationError, notifySuccess } from "~/client/logger";
import CampaignForm from "./CampaignForm";
import { isAllLoaded, toDisplayDate } from "~/client/utils";

type ManageCampaignPanelProps = {
  club: Club;
};

type CreateMembershipCampaignCardProps = {
  onCreateClick: () => void;
};

const CreateMembershipCampaignCard = ({
  onCreateClick
}: CreateMembershipCampaignCardProps) => {
  return (
    <Card p="xl">
      <Stack align="center" gap="md">
        <IconTargetArrow size={32} />
        <Title order={3}>No Active Campaign</Title>
        <Text ta="center">
          Create a membership campaign to set member targets and track
          progress towards your growth goals.
        </Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={onCreateClick}
          size="md"
        >
          Create Campaign
        </Button>
      </Stack>
    </Card>
  );
};

type ActiveMembershipCampaignCardProps = {
  club: Club;
  onEditClick: () => void;
};

const ActiveMembershipCampaignCard = ({
  club,
  onEditClick
}: ActiveMembershipCampaignCardProps) => {
  const utils = api.useUtils();

  const activeMembershipCampaign =
    api.main.getActiveMembershipCampaign.useQuery({ clubId: club.id });

  const activeMembershipCampaignProgress =
    api.main.getActiveMembershipCampaignProgress.useQuery(
      { clubId: club.id },
      { enabled: !!activeMembershipCampaign.data }
    );

  const deleteCampaign = api.main.deleteMembershipCampaign.useMutation({
    onSuccess: () => {
      utils.main.getActiveMembershipCampaign.invalidate({ clubId: club.id });
      notifySuccess(
        "Campaign deleted",
        "The campaign has been deleted successfully"
      );
    },
    onError: handleDefaultMutationError
  });

  const handleDelete = () => {
    if (!activeMembershipCampaign.data) return;

    if (
      window.confirm(
        "Are you sure you want to delete this campaign? This action cannot be undone."
      )
    ) {
      deleteCampaign.mutate({ id: activeMembershipCampaign.data.id });
    }
  };

  if (
    !isAllLoaded([activeMembershipCampaign, activeMembershipCampaignProgress])
  ) {
    return null;
  }

  if (!activeMembershipCampaign.data) {
    return null;
  }

  const progressPercentage = Math.min(
    100,
    (activeMembershipCampaignProgress.data!.committedNumberOfMemberships /
      activeMembershipCampaign.data!.targetNumberOfMemberships) *
      100
  );

  return (
    <Card p="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={3}>Active Campaign</Title>
            <Text size="sm" c="dimmed">
              {`Target Date: ${toDisplayDate(
                new Date(activeMembershipCampaign.data!.targetDate)
              )}`}
            </Text>
          </Box>
          <Group gap="sm">
            <Button
              variant="light"
              leftSection={<IconEdit size={16} />}
              onClick={onEditClick}
              size="sm"
            >
              Edit
            </Button>
            <Button
              variant="light"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={handleDelete}
              size="sm"
            >
              Delete
            </Button>
          </Group>
        </Group>

        <Box>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>
              Member Progress
            </Text>
            <Badge size="lg" variant="light" leftSection={<IconUsers size={14} />}>
              {activeMembershipCampaignProgress.data!.committedNumberOfMemberships} / {activeMembershipCampaign.data!.targetNumberOfMemberships} members
            </Badge>
          </Group>
          <Progress value={progressPercentage} size="lg" radius="md" />
          <Text size="xs" c="dimmed" mt="xs">
            {progressPercentage.toFixed(0)}% of target members achieved
          </Text>
        </Box>

        <Divider />

        <Box>
          <Title order={5} mb="sm">
            Budget Items
          </Title>
          <Stack gap="xs">
            {activeMembershipCampaign.data!.budgetItems.map((item, index) => (
              <Group
                key={index}
                justify="space-between"
                p="xs"
                style={{
                  backgroundColor: "var(--mantine-color-gray-light)"
                }}
              >
                <Text size="sm">{item.label}</Text>
                <Badge variant="dot" size="sm">
                  <IconCurrencyDollar size={14} style={{ marginRight: 4 }} />$
                  {item.costPerMonthInUSD.toFixed(2)}/month
                </Badge>
              </Group>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
};

type EditCampaignCardProps = {
  club: Club;
  onCancel: () => void;
  onSuccess: () => void;
};

const EditCampaignCard = ({
  club,
  onCancel,
  onSuccess
}: EditCampaignCardProps) => {
  const activeMembershipCampaign =
    api.main.getActiveMembershipCampaign.useQuery({ clubId: club.id });

  return (
    <CampaignForm
      club={club}
      campaign={activeMembershipCampaign.data}
      onCancel={onCancel}
      onSuccess={onSuccess}
    />
  );
};

export default function ManageCampaignPanel({
  club
}: ManageCampaignPanelProps) {
  const [isEditing, setIsEditing] = useState(false);

  const activeMembershipCampaign =
    api.main.getActiveMembershipCampaign.useQuery({ clubId: club.id });

  if (!isAllLoaded([activeMembershipCampaign])) {
    return null;
  }

  return (
    <Box py="xl" pos="relative">
      {isEditing ? (
        <EditCampaignCard
          club={club}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      ) : null === activeMembershipCampaign.data ? (
        <CreateMembershipCampaignCard
          onCreateClick={() => setIsEditing(true)}
        />
      ) : (
        <ActiveMembershipCampaignCard
          club={club}
          onEditClick={() => setIsEditing(true)}
        />
      )}
    </Box>
  );
}
