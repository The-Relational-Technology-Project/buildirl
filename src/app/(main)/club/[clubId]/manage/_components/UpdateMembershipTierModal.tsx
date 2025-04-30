import { api } from "~/trpc/react";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import {
  Club,
  LongTextSchema,
  Membership,
  MembershipTier,
  MembershipTierNameSchema,
  MonetaryValueSchema
} from "~/server/service/types";
import {
  Button,
  Modal,
  Slider,
  Stack,
  Textarea,
  TextInput,
  Text,
  Title,
  Group,
  Tooltip
} from "@mantine/core";
import React from "react";
import { isDefaultFreeTier } from "~/utils/types";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { z } from "zod";
import { handleDefaultMutationError } from "~/client/logger";

type UpdateMembershipTierModalProps = {
  club: Club;
  membershipTier: MembershipTier;
  isLastPublished: boolean;
  opened: boolean;
  handleClose: () => void;
};

export default function UpdateMembershipTierModal({
  club,
  membershipTier,
  isLastPublished,
  opened,
  handleClose
}: UpdateMembershipTierModalProps) {
  const utils = api.useUtils();

  const updateMembershipTier = api.main.updateMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: club.id });
      utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
      utils.main.userOwnedClubs.invalidate();
      handleClose();
    },
    onError: handleDefaultMutationError
  });

  const form = useForm({
    initialValues: {
      name: membershipTier.name,
      benefitDescription: membershipTier.benefitDescription,
      contributionDescription: membershipTier.contributionDescription,
      costPerMonthInUSD: membershipTier.costPerMonthInUSD
    },

    validateInputOnChange: true,

    validate: {
      name: (v) => safeValidateSchema(MembershipTierNameSchema, v),
      benefitDescription: (v) => safeValidateSchema(LongTextSchema, v),
      contributionDescription: (v) => safeValidateSchema(LongTextSchema, v),
      costPerMonthInUSD: (v) =>
        safeValidateSchema(MonetaryValueSchema.or(z.literal(0)), v)
    }
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      padding={"xl"}
      yOffset={100}
      title={
        <Text size={"xl"} fw={700}>
          Update Tier
        </Text>
      }
    >
      <form
        onSubmit={form.onSubmit(async (v) => {
          await updateMembershipTier.mutateAsync({
            id: membershipTier.id,
            input: {
              name: v.name,
              benefitDescription: v.benefitDescription,
              contributionDescription: v.contributionDescription,
              costPerMonthInUSD: v.costPerMonthInUSD
            }
          });
        })}
      >
        <Stack>
          <TextInput
            placeholder="Tier name"
            required
            key={form.key("name")}
            {...form.getInputProps("name")}
          />

          <Textarea
            placeholder="Describe the benefits members in this tier can expect."
            rows={5}
            key={form.key("benefitDescription")}
            {...form.getInputProps("benefitDescription")}
          />

          <Textarea
            placeholder="Describe the contributions expected of members in this tier."
            rows={5}
            key={form.key("contributionDescription")}
            {...form.getInputProps("contributionDescription")}
          />

          {!isDefaultFreeTier(membershipTier) && (
            <Stack>
              <Stack gap={4}>
                <Title order={6}>Monthly Cost</Title>
                <Text
                  size={"md"}
                >{`$${form.values.costPerMonthInUSD}.00/month`}</Text>
              </Stack>
              <Slider
                label={(value) => `$${value}.00/month`}
                key={form.key("costPerMonthInUSD")}
                {...form.getInputProps("costPerMonthInUSD")}
                color={"black"}
                size={"xl"}
                precision={2}
                step={5}
                min={5}
                max={100}
              />
            </Stack>
          )}

          <Group style={{ alignSelf: "center" }}>
            <UpdateMembershipTierButton
              clubId={club.id}
              membershipTierId={membershipTier.id}
              isLoading={updateMembershipTier.isPending}
            />
            <DeleteMembershipTierButton
              club={club}
              membershipTier={membershipTier}
              isLastPublished={isLastPublished}
              handleClose={handleClose}
            />
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

type UpdateMembershipTierButtonProps = {
  clubId: number;
  membershipTierId: number;
  isLoading: boolean;
};

function UpdateMembershipTierButton({
  clubId,
  membershipTierId,
  isLoading
}: UpdateMembershipTierButtonProps) {
  const r = api.main.activeMembershipsForClub.useQuery({
    clubId: clubId
  });
  const m = api.main.membershipApplicationsForClub.useQuery({
    clubId: clubId
  });

  QueryError.check({
    result: r,
    fieldName: "activeMembershipsForClub"
  });
  QueryError.check({
    result: r,
    fieldName: "membershipApplicationsForClub"
  });

  const membershipTierIsEligibleForUpdate =
    // allows button to display as disabled until ready
    isAllLoaded([r, m]) &&
    // only tier with no members can be deleted
    hasNoMembershipsForMembershipTier(r.data!, membershipTierId) &&
    hasNoMembershipsForMembershipTier(m.data!, membershipTierId);

  return (
    <Tooltip
      position={"bottom"}
      label={
        "Only tiers with no members or pending applications can be updated."
      }
      hidden={membershipTierIsEligibleForUpdate}
    >
      <Button
        type="submit"
        mt="sm"
        loading={isLoading}
        disabled={!membershipTierIsEligibleForUpdate}
      >
        Update
      </Button>
    </Tooltip>
  );
}

type DeleteMembershipButtonProps = {
  club: Club;
  membershipTier: MembershipTier;
  isLastPublished: boolean;
  handleClose: () => void;
};

function DeleteMembershipTierButton({
  club,
  membershipTier,
  isLastPublished,
  handleClose
}: DeleteMembershipButtonProps) {
  const utils = api.useUtils();

  const r = api.main.activeMembershipsForClub.useQuery({
    clubId: club.id
  });
  const m = api.main.membershipApplicationsForClub.useQuery({
    clubId: club.id
  });

  QueryError.check({
    result: r,
    fieldName: "activeMembershipsForClub"
  });
  QueryError.check({
    result: r,
    fieldName: "membershipApplicationsForClub"
  });

  const deleteMembershipTier = api.main.deleteMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: club.id });
      utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
      utils.main.userOwnedClubs.invalidate();
      handleClose();
    },
    onError: handleDefaultMutationError
  });

  const membershipTierIsEligibleForDeletion =
    !isLastPublished &&
    // default free tier cannot be deleted
    !isDefaultFreeTier(membershipTier) &&
    // allows button to display as disabled until ready
    isAllLoaded([r, m]) &&
    // only tier with no members can be deleted
    hasNoMembershipsForMembershipTier(r.data!, membershipTier.id) &&
    hasNoMembershipsForMembershipTier(m.data!, membershipTier.id);

  return (
    <Tooltip
      position={"bottom"}
      label={deleteButtonTooltipLabel(membershipTier, isLastPublished)}
      hidden={membershipTierIsEligibleForDeletion}
    >
      <Button
        mt="sm"
        color={"red"}
        onClick={async () => {
          await deleteMembershipTier.mutateAsync({
            id: membershipTier.id
          });
        }}
        disabled={!membershipTierIsEligibleForDeletion}
        loading={deleteMembershipTier.isPending}
      >
        Delete
      </Button>
    </Tooltip>
  );
}

function hasNoMembershipsForMembershipTier(
  memberships: Membership[],
  membershipTierId: number
): boolean {
  const membershipsForTier = memberships.filter(
    (m) => m.membershipTier.id === membershipTierId
  );
  return membershipsForTier.length === 0;
}

function deleteButtonTooltipLabel(
  membershipTier: MembershipTier,
  isLastPublished: boolean
) {
  if (isDefaultFreeTier(membershipTier)) {
    return "The free tier cannot be deleted.";
  }
  if (isLastPublished) {
    return "There must be at least one active published tier.";
  }
  return "Only tiers with no members or pending applications can be deleted.";
}
