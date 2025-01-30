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

type UpdateMembershipTierModalProps = {
  club: Club;
  membershipTier: MembershipTier;
  opened: boolean;
  handleClose: () => void;
};

export function UpdateMembershipTierModal({
  club,
  membershipTier,
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
    }
  });

  const form = useForm({
    initialValues: {
      name: membershipTier.name,
      benefitDescription: membershipTier.benefitDescription,
      contributionDescription: membershipTier.contributionDescription,
      costPerMonthInUSD: membershipTier.costPerMonthInUSD
    },

    validate: {
      name: (v) => safeValidateSchema(MembershipTierNameSchema, v),
      benefitDescription: (v) => safeValidateSchema(LongTextSchema, v),
      contributionDescription: (v) => safeValidateSchema(LongTextSchema, v),
      costPerMonthInUSD: (v) => safeValidateSchema(MonetaryValueSchema, v)
    }
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      padding={"xl"}
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
            defaultValue={form.values.name}
            placeholder="Tier name"
            required
            onChange={(e) => form.setFieldValue("name", e.currentTarget.value)}
            error={form.errors.name}
          />

          <Textarea
            defaultValue={form.values.contributionDescription}
            placeholder="Describe the contributions expected of members in this tier."
            minRows={3}
            onChange={(e) =>
              form.setFieldValue(
                "contributionDescription",
                e.currentTarget.value
              )
            }
            error={form.errors.contributionDescription}
          />

          <Textarea
            defaultValue={form.values.benefitDescription}
            placeholder="Describe the benefits members in this tier can expect."
            onChange={(e) =>
              form.setFieldValue("benefitDescription", e.currentTarget.value)
            }
            error={form.errors.benefitDescription}
          />

          {!isDefaultFreeTier(membershipTier) && (
            <Stack>
              <Title order={6}>Monthly Cost</Title>
              <Slider
                label={(value) => `$${value}.00/month`}
                onChange={(v) => form.setFieldValue("costPerMonthInUSD", v)}
                color={"black"}
                size={"xl"}
                defaultValue={form.values.costPerMonthInUSD}
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
  const utils = api.useUtils();

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
      <Button type="submit" mt="sm" loading={isLoading}>
        Update
      </Button>
    </Tooltip>
  );
}

type DeleteMembershipButtonProps = {
  club: Club;
  membershipTier: MembershipTier;
  handleClose: () => void;
};

function DeleteMembershipTierButton({
  club,
  membershipTier,
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
    }
  });

  const membershipTierIsEligibleForDeletion =
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
      label={
        isDefaultFreeTier(membershipTier)
          ? "The free tier cannot be deleted."
          : "Only tiers with no members or pending applications can be deleted."
      }
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
