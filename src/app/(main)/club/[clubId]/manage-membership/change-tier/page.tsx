"use client";

import {
  Stack,
  Title,
  Text,
  TitleOrder,
  useMatches,
  Modal,
  Button,
  Group
} from "@mantine/core";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { useMounted, useDisclosure } from "@mantine/hooks";
import { MembershipTier } from "~/server/membershipTier/types";
import { isDefaultFreeTier, Maybe } from "~/utils/types";
import { useState } from "react";
import { MembershipTierCarousel } from "~/client/components/MembershipTierCarousel";

export default function ChangeTierPage() {
  const titleOrder = useMatches<TitleOrder>({ base: 2, md: 1 });
  const titleAndCardGap = useMatches({ base: "lg", md: "xl" });
  const mounted = useMounted();

  const router = useRouter();
  const params = useParams<{ clubId: string }>();

  const utils = api.useUtils();

  const [opened, { open, close }] = useDisclosure(false);
  const [selectedTier, setSelectedTier] = useState<Maybe<MembershipTier>>(null);

  const club = api.main.club.useQuery({
    id: parseInt(params.clubId)
  });
  const memberships = api.main.userMemberships.useQuery();

  const updateTierMutation =
    api.main.updateMembershipTierForMembership.useMutation({
      onSuccess: async () => {
        await utils.main.userMemberships.invalidate();
        await utils.main.club.invalidate({ id: parseInt(params.clubId) });
        close();
        router.push(`/club/${params.clubId}/manage-membership`);
      }
    });

  QueryError.check({
    result: club,
    fieldName: "club"
  });

  QueryError.check({
    result: memberships,
    fieldName: "userMemberships"
  });

  if (!isLoaded(club) || !isLoaded(memberships)) {
    return null;
  }

  const currentMembership = memberships.data?.find(
    (m) => m.club.id === parseInt(params.clubId)
  );

  if (!currentMembership) {
    throw new Error("cannot change tier if missing membership to club");
  }

  const publishedTiers = club.data!.membershipTiers.filter(
    (t) => t.status === "PUBLISHED"
  );

  const handleTierSelect = (tier: MembershipTier) => {
    setSelectedTier(tier);
    open();
  };

  const handleConfirmChange = async () => {
    if (!selectedTier) return;

    await updateTierMutation.mutateAsync({
      membershipId: currentMembership.id,
      newMembershipTierId: selectedTier.id
    });
  };

  const getConfirmationMessage = () => {
    if (!selectedTier) return "";

    const currentTier = currentMembership.membershipTier;
    const isCurrentFree = isDefaultFreeTier(currentTier);
    const isNewFree = isDefaultFreeTier(selectedTier);

    let message = `Change from "${currentTier.name}" to "${selectedTier.name}\n\n"?`;

    if (isCurrentFree && isNewFree) {
      message += "You will not be charged.";
    } else if (!isCurrentFree && isNewFree) {
      message += "This will cancel your current subscription.";
    } else if (isCurrentFree && !isNewFree) {
      message += `This will start a new subscription.`;
    } else if (!isCurrentFree && !isNewFree) {
      if (currentTier.billingInterval === selectedTier.billingInterval) {
        message +=
          "Your new subscription will start immediately. You will receive a proration for old subscription.";
      } else {
        message += `Your new subscription will start immediately.`;
      }
    }

    return message;
  };

  return (
    mounted && (
      <WithLocalNavigationHeader>
        <Stack gap={titleAndCardGap}>
          <Stack align={"center"} gap={6}>
            <Title order={titleOrder}>Change Your Membership</Title>
            <Text size={"lg"} ta="center">
              Select a new membership tier
            </Text>
            <Text size="sm" ta="center" mt="xs">
              Currently on: {currentMembership.membershipTier.name}
            </Text>
          </Stack>

          <MembershipTierCarousel
            tiers={publishedTiers}
            onTierSelect={handleTierSelect}
            excludedTierId={currentMembership.membershipTier.id}
          />
        </Stack>

        <Modal
          opened={opened}
          onClose={close}
          title={
            <Text size="xl" fw={700}>
              Confirm Membership Change
            </Text>
          }
        >
          <Stack gap="md">
            <Text style={{ whiteSpace: "pre-line" }}>
              {getConfirmationMessage()}
            </Text>

            <Group justify="flex-end" mt="lg">
              <Button
                variant="subtle"
                onClick={close}
                disabled={updateTierMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmChange}
                loading={updateTierMutation.isPending}
              >
                Confirm Change
              </Button>
            </Group>
          </Stack>
        </Modal>
      </WithLocalNavigationHeader>
    )
  );
}
