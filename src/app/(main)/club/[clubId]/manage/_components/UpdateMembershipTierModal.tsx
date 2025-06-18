import { api } from "~/trpc/react";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import {
  Button,
  Modal,
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
import {
  CostInput,
  DEFAULT_INITIATION_FEE_USD,
  NullableCostInput
} from "~/app/(main)/club/[clubId]/manage/_components/CostInput";
import { Club } from "~/server/club/types";
import {
  MembershipTier,
  MembershipTierNameSchema
} from "~/server/membershipTier/types";
import { LongTextSchema, MonetaryValueSchema } from "~/server/utils/types";
import { Membership } from "~/server/membership/types";

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
      utils.main.userMemberships.invalidate();
      handleClose();
    },
    onError: handleDefaultMutationError
  });

  const form = useForm({
    initialValues: {
      name: membershipTier.name,
      benefitDescription: membershipTier.benefitDescription,
      contributionDescription: membershipTier.contributionDescription,
      costPerMonthInUSD: membershipTier.costPerMonthInUSD,
      initiationFeeCostInUSD: membershipTier.initiationFeeCostInUSD
    },

    validateInputOnChange: true,

    validate: {
      name: (v) => safeValidateSchema(MembershipTierNameSchema, v),
      benefitDescription: (v) => safeValidateSchema(LongTextSchema, v),
      contributionDescription: (v) => safeValidateSchema(LongTextSchema, v),
      costPerMonthInUSD: (v) =>
        safeValidateSchema(MonetaryValueSchema.or(z.literal(0)), v),
      initiationFeeCostInUSD: (v) =>
        safeValidateSchema(MonetaryValueSchema.nullable(), v)
    }
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      padding={"xl"}
      centered
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
              costPerMonthInUSD: v.costPerMonthInUSD,
              initiationFeeCostInUSD: v.initiationFeeCostInUSD
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
              <Stack gap={12}>
                <Title order={6}>Monthly Cost</Title>
                <CostInput
                  value={form.values.costPerMonthInUSD}
                  onChange={(value) =>
                    form.setFieldValue("costPerMonthInUSD", value)
                  }
                />
              </Stack>

              <Stack gap={12}>
                <Title order={6}>Initiation Fee</Title>
                <NullableCostInput
                  value={form.values.initiationFeeCostInUSD}
                  onChange={(value) =>
                    form.setFieldValue("initiationFeeCostInUSD", value)
                  }
                  defaultValue={DEFAULT_INITIATION_FEE_USD}
                />
              </Stack>
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
  const activeMembershipsForClub = api.main.activeMembershipsForClub.useQuery({
    clubId: clubId
  });
  const membershipApplicationsForClub =
    api.main.membershipApplicationsForClub.useQuery({
      clubId: clubId
    });

  QueryError.check({
    result: activeMembershipsForClub,
    fieldName: "activeMembershipsForClub"
  });
  QueryError.check({
    result: membershipApplicationsForClub,
    fieldName: "membershipApplicationsForClub"
  });

  const membershipTierRequiresWarningBeforeUpdate =
    // allows button to display as disabled until ready
    (isAllLoaded([activeMembershipsForClub, membershipApplicationsForClub]) &&
      // tier with active members or pending applications require warning before update
      !hasNoMembershipsForMembershipTier(
        activeMembershipsForClub.data!,
        membershipTierId
      )) ||
    !hasNoMembershipsForMembershipTier(
      membershipApplicationsForClub.data!,
      membershipTierId
    );

  return (
    <Button
      type="submit"
      mt="sm"
      loading={isLoading}
      onClick={(e) => {
        if (
          membershipTierRequiresWarningBeforeUpdate &&
          !window.confirm(
            "This tier currently has active members or pending applications. If you are making significant changes to the tier, please ensure the changes are communicated."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      Update
    </Button>
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

  const activeMembershipsForClub = api.main.activeMembershipsForClub.useQuery({
    clubId: club.id
  });
  const membershipApplicationsForClub =
    api.main.membershipApplicationsForClub.useQuery({
      clubId: club.id
    });

  QueryError.check({
    result: activeMembershipsForClub,
    fieldName: "activeMembershipsForClub"
  });
  QueryError.check({
    result: activeMembershipsForClub,
    fieldName: "membershipApplicationsForClub"
  });

  const deleteMembershipTier = api.main.deleteMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: club.id });
      utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
      utils.main.userMemberships.invalidate();
      handleClose();
    },
    onError: handleDefaultMutationError
  });

  const membershipTierIsEligibleForDeletion =
    !isLastPublished &&
    // default free tier cannot be deleted
    !isDefaultFreeTier(membershipTier) &&
    // allows button to display as disabled until ready
    isAllLoaded([activeMembershipsForClub, membershipApplicationsForClub]) &&
    // only tier with no active members or pending applications can be deleted
    hasNoMembershipsForMembershipTier(
      activeMembershipsForClub.data!,
      membershipTier.id
    ) &&
    hasNoMembershipsForMembershipTier(
      membershipApplicationsForClub.data!,
      membershipTier.id
    );

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
