// noinspection DuplicatedCode

import React from "react";
import {
  Stack,
  TextInput,
  NumberInput,
  Button,
  Group,
  Title,
  Text,
  Box,
  Paper
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconPlus, IconX, IconDeviceFloppy } from "@tabler/icons-react";
import { Club } from "~/server/club/types";
import { api } from "~/trpc/react";
import { handleDefaultMutationError, notifySuccess } from "~/client/logger";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";
import {
  MembershipCampaign,
  CreateMembershipCampaignInputSchema,
  CreateMembershipCampaignInput,
  UpdateMembershipCampaignInputSchema,
  UpdateMembershipCampaignInput
} from "~/server/membershipCampaign/types";
import { Maybe } from "~/utils/types";

type CampaignFormProps = {
  club: Club;
  campaign?: Maybe<MembershipCampaign>;
  onCancel: () => void;
  onSuccess: () => void;
};

type CreateCampaignFormProps = {
  club: Club;
  onCancel: () => void;
  onSuccess: () => void;
};

function tomorrow(): Date {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return tomorrow;
}

function CreateCampaignForm({
  club,
  onCancel,
  onSuccess
}: CreateCampaignFormProps) {
  const utils = api.useUtils();

  const createCampaign = api.main.createMembershipCampaign.useMutation({
    onSuccess: () => {
      utils.main.getActiveMembershipCampaign.invalidate({ clubId: club.id });
      utils.main.getActiveMembershipCampaignProgress.invalidate({
        clubId: club.id
      });
      notifySuccess(
        "Campaign created",
        "Your membership campaign has been created successfully"
      );
      onSuccess();
    },
    onError: handleDefaultMutationError
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<CreateMembershipCampaignInput>({
    resolver: zodResolver(CreateMembershipCampaignInputSchema),
    defaultValues: {
      targetNumberOfMemberships: 10,
      budgetItems: [{ label: "", costPerMonthInUSD: 0 }],
      targetDate: undefined
    },
    mode: "onSubmit"
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "budgetItems"
  });

  const onSubmit = async (data: CreateMembershipCampaignInput) => {
    await createCampaign.mutateAsync({
      clubId: club.id,
      input: data
    });
  };

  // calculate total
  const budgetItems = watch("budgetItems");
  const total = budgetItems.reduce(
    (sum, item) => sum + (item.costPerMonthInUSD || 0),
    0
  );

  return (
    <Paper p={"lg"}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={20}>
          <Stack gap={8}>
            <Title order={1}>Set Up Your Member Campaign</Title>
            <Text
              size={"lg"}
            >{`Rally new members, get ongoing contributions, and keep your club sustainable. Let’s get it ready!`}</Text>
          </Stack>

          <Group grow align="flex-start">
            <Stack gap={8}>
              <Stack gap={0}>
                <Title order={5}>New Member Target</Title>
                <Text size="sm">{`# of members you need for this campaign to be successful.`}</Text>
              </Stack>{" "}
              <Controller
                name="targetNumberOfMemberships"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    {...field}
                    placeholder="10"
                    min={2}
                    max={999}
                    error={errors.targetNumberOfMemberships?.message}
                    required
                  />
                )}
              />
              <Text size="xs" c="gray" fs="italic">
                Most clubs aim for 10–30. Only paid-tier applicants count toward
                your goal.
              </Text>
            </Stack>

            <Stack gap={8}>
              <Stack gap={0}>
                <Title order={5}>Campaign End Date</Title>
                <Text size="sm">{`When your campaign stops showing on your club page.`}</Text>
              </Stack>{" "}
              <Controller
                name="targetDate"
                control={control}
                render={({ field }) => (
                  <DateInput
                    placeholder="Select target date"
                    value={field.value || null}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    minDate={tomorrow()}
                    error={errors.targetDate?.message}
                    weekendDays={[]}
                    required
                    clearable={false}
                  />
                )}
              />
              <Text size="xs" c="gray" fs="italic">
                Campaign will end at 11:59 PM PST
              </Text>
            </Stack>
          </Group>

          <Stack gap={0}>
            <Title order={3}>
              What Your Club Needs Each Month (and Why It Matters)
            </Title>
            <Text size="md">{`Showing people your club’s monthly needs helps them understand why contributions matter. Add high-level cost estimates to show what it takes to keep the club going.`}</Text>
          </Stack>

          <Stack gap={8}>
            <Group justify="space-between">
              <Title order={5}>Budget Items</Title>
            </Group>

            <Stack gap="sm">
              {fields.map((field, index) => (
                <Group key={field.id} gap="sm" align="flex-start">
                  <Controller
                    name={`budgetItems.${index}.label`}
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        {...field}
                        placeholder="Venue, food, supplies, host time, etc."
                        error={errors.budgetItems?.[index]?.label?.message}
                        style={{ flex: 1 }}
                      />
                    )}
                  />
                  <Controller
                    name={`budgetItems.${index}.costPerMonthInUSD`}
                    control={control}
                    render={({ field }) => (
                      <NumberInput
                        {...field}
                        placeholder="0"
                        prefix="$"
                        suffix="/month"
                        decimalScale={0}
                        fixedDecimalScale
                        min={1}
                        max={99999}
                        error={
                          errors.budgetItems?.[index]?.costPerMonthInUSD
                            ?.message
                        }
                        w={150}
                      />
                    )}
                  />
                  <ColorSchemeAwareActionIcon
                    mt={4}
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <IconX size={16} />
                  </ColorSchemeAwareActionIcon>
                </Group>
              ))}
              {errors.budgetItems?.message && (
                <Text c="red" size="sm">
                  {errors.budgetItems.message}
                </Text>
              )}

              <Button
                variant="subtle"
                size="sm"
                leftSection={<IconPlus size={14} />}
                onClick={() => append({ label: "", costPerMonthInUSD: 0 })}
                disabled={fields.length >= 5}
                bd={"1px black solid"}
                w={200}
              >
                Add Cost Bucket
              </Button>
              {errors.budgetItems?.message && (
                <Text c="red" size="sm">
                  {errors.budgetItems.message}
                </Text>
              )}
            </Stack>

            <Group justify="flex-end">
              <Text size="sm" fw={500}>
                Total: ${total}/month
              </Text>
            </Group>
          </Stack>
          <Box
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            {Object.keys(errors).length > 0 && (
              <Text style={{ fontSize: "12px", color: "red" }} mb="sm">
                Please review required fields above.
              </Text>
            )}
            <Group>
              <Button
                variant="default"
                onClick={onCancel}
                disabled={createCampaign.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createCampaign.isPending}
                disabled={Object.keys(errors).length > 0}
                leftSection={<IconDeviceFloppy size={16} />}
              >
                Create Campaign
              </Button>
            </Group>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
}

type EditCampaignFormProps = {
  club: Club;
  campaign: MembershipCampaign;
  onCancel: () => void;
  onSuccess: () => void;
};

function EditCampaignForm({
  club,
  campaign,
  onCancel,
  onSuccess
}: EditCampaignFormProps) {
  const utils = api.useUtils();

  const updateCampaign = api.main.updateMembershipCampaign.useMutation({
    onSuccess: () => {
      utils.main.getActiveMembershipCampaign.invalidate({ clubId: club.id });
      utils.main.getActiveMembershipCampaignProgress.invalidate({
        clubId: club.id
      });
      notifySuccess(
        "Campaign updated",
        "Your membership campaign has been updated successfully"
      );
      onSuccess();
    },
    onError: handleDefaultMutationError
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<UpdateMembershipCampaignInput>({
    resolver: zodResolver(UpdateMembershipCampaignInputSchema),
    defaultValues: {
      targetNumberOfMemberships: campaign.targetNumberOfMemberships,
      budgetItems: campaign.budgetItems,
      targetDate: campaign.targetDate
    },
    mode: "onSubmit"
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "budgetItems"
  });

  const onSubmit = async (data: UpdateMembershipCampaignInput) => {
    await updateCampaign.mutateAsync({
      id: campaign.id,
      input: data
    });
  };

  // calculate total
  const budgetItems = watch("budgetItems");
  const total = budgetItems.reduce(
    (sum, item) => sum + (item.costPerMonthInUSD || 0),
    0
  );

  return (
    <Paper p={"lg"}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={24}>
          <Stack gap={8}>
            <Title order={1}>Set Up Your Member Campaign</Title>
            <Text
              size={"lg"}
            >{`Rally new members, get ongoing contributions, and keep your club sustainable. Let’s get it ready!`}</Text>
          </Stack>

          <Group grow align="flex-start" gap={48}>
            <Stack gap={8}>
              <Stack gap={0}>
                <Title order={5}>New Member Target</Title>
                <Text size="sm">{`# of members you need for this campaign to be successful.`}</Text>
              </Stack>
              <Controller
                name="targetNumberOfMemberships"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    {...field}
                    placeholder="10"
                    min={2}
                    max={999}
                    error={errors.targetNumberOfMemberships?.message}
                    required
                  />
                )}
              />
              <Text size="xs" c="gray" fs="italic">
                Most clubs aim for 10–30. Only paid-tier applicants count toward
                your goal.
              </Text>
            </Stack>

            <Stack gap={8}>
              <Stack gap={0}>
                <Title order={5}>Campaign End Date</Title>
                <Text size="sm">{`When your campaign stops showing on your club page.`}</Text>
              </Stack>

              <Controller
                name="targetDate"
                control={control}
                render={({ field }) => (
                  <DateInput
                    placeholder="Select target date"
                    value={field.value || null}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    minDate={tomorrow()}
                    error={errors.targetDate?.message}
                    weekendDays={[]}
                    required
                    clearable={false}
                  />
                )}
              />
              <Text size="xs" c="gray" fs="italic">
                Campaign ends 11:59 PM PST
              </Text>
            </Stack>
          </Group>

          <Stack gap={0}>
            <Title order={3}>
              What Your Club Needs Each Month (and Why It Matters)
            </Title>
            <Text size="md">{`Showing people your club’s monthly needs helps them understand why contributions matter. Add high-level cost estimates to show what it takes to keep the club going.`}</Text>
          </Stack>

          <Stack gap={8}>
            <Stack gap="sm">
              {fields.map((field, index) => (
                <Group key={field.id} gap="sm" align="flex-start">
                  <Controller
                    name={`budgetItems.${index}.label`}
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        {...field}
                        placeholder="Venue, food, supplies, host time, etc."
                        error={errors.budgetItems?.[index]?.label?.message}
                        style={{ flex: 1 }}
                      />
                    )}
                  />
                  <Controller
                    name={`budgetItems.${index}.costPerMonthInUSD`}
                    control={control}
                    render={({ field }) => (
                      <NumberInput
                        {...field}
                        placeholder="0"
                        prefix="$"
                        suffix="/month"
                        decimalScale={0}
                        fixedDecimalScale
                        min={1}
                        max={99999}
                        error={
                          errors.budgetItems?.[index]?.costPerMonthInUSD
                            ?.message
                        }
                        w={150}
                      />
                    )}
                  />
                  <ColorSchemeAwareActionIcon
                    mt={4}
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <IconX size={16} />
                  </ColorSchemeAwareActionIcon>
                </Group>
              ))}

              <Button
                variant="subtle"
                size="sm"
                leftSection={<IconPlus size={14} />}
                onClick={() => append({ label: "", costPerMonthInUSD: 0 })}
                disabled={fields.length >= 5}
                bd={"1px black solid"}
                w={200}
              >
                Add Cost Bucket
              </Button>
              {errors.budgetItems?.message && (
                <Text c="red" size="sm">
                  {errors.budgetItems.message}
                </Text>
              )}
            </Stack>

            <Group justify="flex-end">
              <Text size="sm" fw={500}>
                Total: ${total}/month
              </Text>
            </Group>
          </Stack>

          <Box
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            {Object.keys(errors).length > 0 && (
              <Text style={{ fontSize: "12px", color: "red" }} mb="sm">
                Please review required fields above.
              </Text>
            )}
            <Group>
              <Button
                variant="default"
                onClick={onCancel}
                disabled={updateCampaign.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={updateCampaign.isPending}
                disabled={Object.keys(errors).length > 0}
                leftSection={<IconDeviceFloppy size={16} />}
              >
                Update Campaign
              </Button>
            </Group>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
}

export default function CampaignForm({
  club,
  campaign,
  onCancel,
  onSuccess
}: CampaignFormProps) {
  if (campaign) {
    return (
      <EditCampaignForm
        club={club}
        campaign={campaign}
        onCancel={onCancel}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <CreateCampaignForm club={club} onCancel={onCancel} onSuccess={onSuccess} />
  );
}
