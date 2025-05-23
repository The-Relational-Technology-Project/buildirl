import { api } from "~/trpc/react";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import {
  Club,
  LongTextSchema,
  MembershipTierNameSchema,
  MonetaryValueSchema
} from "~/server/service/types";
import {
  Button,
  Modal,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title
} from "@mantine/core";
import React from "react";
import { handleDefaultMutationError } from "~/client/logger";
import { Maybe } from "~/utils/types";
import {
  CostInput,
  DEFAULT_COST_PER_MONTH_USD,
  DEFAULT_INITIATION_FEE_USD,
  NullableCostInput
} from "~/app/(main)/club/[clubId]/manage/_components/CostInput";

type CreateMembershipTierModalProps = {
  club: Club;
  opened: boolean;
  handleClose: () => void;
};

export default function CreateMembershipTierModal({
  club,
  opened,
  handleClose
}: CreateMembershipTierModalProps) {
  const utils = api.useUtils();

  const createMembershipTier = api.main.createMembershipTier.useMutation({
    onSuccess: (_, v) => {
      utils.main.club.invalidate({ id: v.clubId });
      utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
      utils.main.userOwnedClubs.invalidate();
      handleClose();
    },
    onError: handleDefaultMutationError
  });

  const form = useForm({
    initialValues: {
      name: "",
      benefitDescription: "",
      contributionDescription: "",
      costPerMonthInUSD: DEFAULT_COST_PER_MONTH_USD,
      initiationFeeCostInUSD: null as Maybe<number>
    },

    validateInputOnChange: true,

    validate: {
      name: (v) => safeValidateSchema(MembershipTierNameSchema, v),
      benefitDescription: (v) => safeValidateSchema(LongTextSchema, v),
      contributionDescription: (v) => safeValidateSchema(LongTextSchema, v),
      costPerMonthInUSD: (v) => safeValidateSchema(MonetaryValueSchema, v),
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
          Create Tier
        </Text>
      }
    >
      <form
        onSubmit={form.onSubmit(async (v) => {
          await createMembershipTier.mutateAsync({
            clubId: club.id,
            input: {
              name: v.name,
              benefitDescription: v.benefitDescription,
              contributionDescription: v.contributionDescription,
              costPerMonthInUSD: v.costPerMonthInUSD,
              initiationFeeCostInUSD: v.initiationFeeCostInUSD
            }
          });
          form.reset();
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

          <Stack gap={12}>
            <Title order={6}>Monthly Cost</Title>
            <CostInput
              value={form.values.costPerMonthInUSD}
              onChange={(value) =>
                form.setFieldValue("costPerMonthInUSD", value)
              }
              defaultValue={DEFAULT_COST_PER_MONTH_USD}
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
