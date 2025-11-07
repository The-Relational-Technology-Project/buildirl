import React, { useState } from "react";
import {
  Box,
  Card,
  Stack,
  Title,
  Text,
  Button,
  Group,
  Progress,
  ActionIcon
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconTargetArrow
} from "@tabler/icons-react";
import { Club } from "~/server/club/types";
import { api } from "~/trpc/react";
import { handleDefaultMutationError, notifySuccess } from "~/client/logger";
import CampaignForm from "./CampaignForm";
import { isAllLoaded, toDisplayDate } from "~/client/utils";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";
import PaidMembershipTierRequiredModal from "./PaidMembershipTierRequiredModal";
import { useDisclosure } from "@mantine/hooks";

type ManageCampaignPanelProps = {
  club: Club;
};

type CreateMembershipCampaignCardProps = {
  club: Club;
  onCreateClick: () => void;
};

const CreateMembershipCampaignCard = ({
  club,
  onCreateClick
}: CreateMembershipCampaignCardProps) => {
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  // check if there's at least one published paid tier
  const hasPaidTier = club.membershipTiers.some(
    (tier) => tier.status === "PUBLISHED" && tier.costPerBillingInterval > 0
  );

  const handleCreateClick = () => {
    if (!hasPaidTier) {
      openModal();
      return;
    }
    onCreateClick();
  };

  return (
    <>
      <Card p="xl">
        <Stack align="center" gap="md">
          <IconTargetArrow size={32} />
          <Title order={3}>No Active Campaign</Title>
          <Text ta="center">
            {`Rally new members, get ongoing contributions, and keep your club
            sustainable. Let’s get it ready!`}
          </Text>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreateClick}
            size="md"
          >
            Create Campaign
          </Button>
        </Stack>
      </Card>

      <PaidMembershipTierRequiredModal
        clubId={club.id}
        opened={modalOpened}
        handleClose={closeModal}
      />
    </>
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
      {
        clubId: club.id,
        launchDate: activeMembershipCampaign.data!.launchDate
      },
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

  const progressPercentage = Math.min(
    100,
    (activeMembershipCampaignProgress.data!.committedNumberOfMemberships /
      activeMembershipCampaign.data!.targetNumberOfMemberships) *
      100
  );

  return (
    <Card p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Title order={3}>Active Campaign</Title>
          <Group gap="xs">
            <ColorSchemeAwareActionIcon onClick={onEditClick}>
              <IconEdit size={20} />
            </ColorSchemeAwareActionIcon>
            <ActionIcon onClick={handleDelete} color={"red"}>
              <IconTrash size={20} />
            </ActionIcon>
          </Group>
        </Group>

        <Stack gap={"sm"}>
          <Title order={5}>Target Date</Title>
          <Text>
            {toDisplayDate(new Date(activeMembershipCampaign.data!.targetDate))}
          </Text>
        </Stack>

        <Stack gap={"sm"}>
          <Title order={5}>Member Progress</Title>
          <Progress value={progressPercentage} size={20} color={"lilac"} />
          <Text size="md" style={{ alignSelf: "center" }}>
            {`${
              activeMembershipCampaignProgress.data!
                .committedNumberOfMemberships
            } committed out of ${activeMembershipCampaign.data!.targetNumberOfMemberships} target members`}
          </Text>
        </Stack>

        <Stack gap={"sm"}>
          <Title order={5} mb="sm">
            Budget Items
          </Title>
          <Stack gap="xs">
            {activeMembershipCampaign.data!.budgetItems.map((item, index) => (
              <Group
                key={index}
                justify="space-between"
                p="xs"
                style={{ border: "1px solid" }}
              >
                <Text size="sm">{item.label}</Text>
                <Text size="sm" fw={500}>
                  ${item.costPerMonthInUSD}/month
                </Text>
              </Group>
            ))}
          </Stack>
        </Stack>
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
          club={club}
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
