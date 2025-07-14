"use client";

import {
  Stack,
  Title,
  Text,
  TitleOrder,
  useMatches,
  Modal,
  Button,
  Group,
  Alert,
} from "@mantine/core";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { MembershipTierCarousel } from "~/components/membership/MembershipTierCarousel";
import { useMounted, useDisclosure } from "@mantine/hooks";
import { MembershipTier } from "~/server/membershipTier/types";
import { formatBillingInterval } from "~/client/utils";
import { isDefaultFreeTier } from "~/utils/types";
import { useState } from "react";
import { IconAlertCircle } from "@tabler/icons-react";

export default function ChangeTierPage() {
  const titleOrder = useMatches<TitleOrder>({ base: 2, md: 1 });
  const titleAndCardGap = useMatches({ base: "lg", md: "xl" });
  const mounted = useMounted();
  const router = useRouter();
  const params = useParams<{ clubId: string }>();
  const utils = api.useUtils();

  const [opened, { open, close }] = useDisclosure(false);
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);

  const club = api.main.club.useQuery({
    id: parseInt(params.clubId)
  });

  const memberships = api.main.userMemberships.useQuery();

  const updateTierMutation = api.main.updateMembershipTierForMembership.useMutation({
    onSuccess: async () => {
      await utils.main.userMemberships.invalidate();
      await utils.main.club.invalidate({ id: parseInt(params.clubId) });
      close();
      router.push(`/club/${params.clubId}/manage-membership`);
    },
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
    m => m.club.id === parseInt(params.clubId)
  );

  if (!currentMembership) {
    router.push(`/club/${params.clubId}`);
    return null;
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
      newMembershipTierId: selectedTier.id,
    });
  };

  const getConfirmationMessage = () => {
    if (!selectedTier) return "";

    const currentTier = currentMembership.membershipTier;
    const isCurrentFree = isDefaultFreeTier(currentTier);
    const isNewFree = isDefaultFreeTier(selectedTier);
    
    let message = `Change from "${currentTier.name}" to "${selectedTier.name}"?`;
    
    if (!isCurrentFree && isNewFree) {
      message += "\n\nThis will cancel your current subscription. You will retain access until the end of your current billing period.";
    } else if (isCurrentFree && !isNewFree) {
      const interval = formatBillingInterval(selectedTier.billingInterval);
      message += `\n\nThis will start a new subscription at $${selectedTier.costPerBillingInterval}/${interval}.`;
    } else if (!isCurrentFree && !isNewFree) {
      const priceDiff = selectedTier.costPerBillingInterval - currentTier.costPerBillingInterval;
      if (priceDiff > 0) {
        message += `\n\nThis will increase your subscription by $${priceDiff}. The change will take effect at the next billing cycle.`;
      } else if (priceDiff < 0) {
        message += `\n\nThis will decrease your subscription by $${Math.abs(priceDiff)}. The change will take effect at the next billing cycle.`;
      } else if (currentTier.billingInterval !== selectedTier.billingInterval) {
        const currentInterval = formatBillingInterval(currentTier.billingInterval);
        const newInterval = formatBillingInterval(selectedTier.billingInterval);
        message += `\n\nThis will change your billing interval from ${currentInterval} to ${newInterval}.`;
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
              Select a new membership tier for {club.data!.name}
            </Text>
            <Text size="sm" c="dimmed" ta="center" mt="xs">
              Currently on: {currentMembership.membershipTier.name}
            </Text>
          </Stack>

          <MembershipTierCarousel
            tiers={publishedTiers}
            onTierSelect={handleTierSelect}
            buttonText="Select This Tier"
            buttonColor="blue"
            excludeTierId={currentMembership.membershipTier.id}
          />

          <Text
            size={"sm"}
            style={{ alignSelf: "center", textAlign: "center" }}
            mb={20}
          >
            Changes to paid tiers will take effect at your next billing cycle.
          </Text>
        </Stack>

        <Modal
          opened={opened}
          onClose={close}
          title={
            <Text size="xl" fw={700}>
              Confirm Membership Change
            </Text>
          }
          centered
          padding="xl"
          size="md"
        >
          <Stack gap="md">
            <Text style={{ whiteSpace: "pre-line" }}>
              {getConfirmationMessage()}
            </Text>

            {updateTierMutation.error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red">
                {updateTierMutation.error.message}
              </Alert>
            )}

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
                disabled={updateTierMutation.isPending}
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