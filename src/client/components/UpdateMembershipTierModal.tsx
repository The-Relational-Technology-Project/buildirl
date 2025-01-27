import { api } from "~/trpc/react";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import {
  LongTextSchema,
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
  Title
} from "@mantine/core";
import React from "react";

type UpdateMembershipTierModalProps = {
  clubId: number;
  membershipTier: MembershipTier;
  opened: boolean;
  handleClose: () => void;
};

export function UpdateMembershipTierModal({
  clubId,
  membershipTier,
  opened,
  handleClose
}: UpdateMembershipTierModalProps) {
  const utils = api.useUtils();

  const updateMembershipTier = api.main.updateMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: clubId });
      utils.main.userOwnedClubs.invalidate();
      handleClose();
    }
  });
  const deleteMembershipTier = api.main.deleteMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: clubId });
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
      title={<Title order={3}>Create tier</Title>}
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
          form.reset();
        })}
      >
        <Stack>
          <TextInput
            defaultValue={membershipTier.name}
            placeholder="Tier name"
            required
            onChange={(e) => form.setFieldValue("name", e.currentTarget.value)}
            error={form.errors.name}
          />

          <Textarea
            defaultValue={membershipTier.contributionDescription}
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
            defaultValue={membershipTier.benefitDescription}
            placeholder="Describe the benefits members in this tier can expect."
            onChange={(e) =>
              form.setFieldValue("benefitDescription", e.currentTarget.value)
            }
            error={form.errors.benefitDescription}
          />

          <Title order={6}>Monthly Cost</Title>
          <Slider
            label={(value) => `$${value}.00/month`}
            onChange={(v) => form.setFieldValue("costPerMonthInUSD", v)}
            color={"black"}
            size={"xl"}
            defaultValue={membershipTier.costPerMonthInUSD}
            precision={2}
            min={1}
            max={100}
          />

          <Button
            type="submit"
            mt="sm"
            style={{ alignSelf: "center" }}
            loading={updateMembershipTier.isPending}
          >
            Update
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
