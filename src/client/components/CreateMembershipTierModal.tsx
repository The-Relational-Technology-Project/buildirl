import { api } from "~/trpc/react";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import {
  LongTextSchema,
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

type CreateMembershipTierModalProps = {
  clubId: number;
  opened: boolean;
  handleClose: () => void;
};

const DEFAULT_COST_PER_MONTH_USD = 50;

export function CreateMembershipTierModal({
  clubId,
  opened,
  handleClose
}: CreateMembershipTierModalProps) {
  const utils = api.useUtils();

  const createMembershipTier = api.main.createMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: clubId });
      utils.main.userOwnedClubs.invalidate();
      handleClose();
    }
  });

  const form = useForm({
    initialValues: {
      name: "",
      benefitDescription: "",
      contributionDescription: "",
      costPerMonthInUSD: DEFAULT_COST_PER_MONTH_USD
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
          await createMembershipTier.mutateAsync({
            clubId: clubId,
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
            placeholder="Tier name"
            required
            onChange={(e) => form.setFieldValue("name", e.currentTarget.value)}
            error={form.errors.name}
          />

          <Textarea
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
            defaultValue={DEFAULT_COST_PER_MONTH_USD}
            precision={2}
            min={1}
            max={100}
          />

          <Button
            type="submit"
            mt="sm"
            style={{ alignSelf: "center" }}
            loading={createMembershipTier.isPending}
          >
            Create
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
