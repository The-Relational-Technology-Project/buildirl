import React from "react";
import {
  Card,
  Stack,
  TextInput,
  NumberInput,
  Button,
  Group,
  Title,
  Text,
  Box
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconPlus,
  IconX,
  IconDeviceFloppy,
  IconArrowLeft
} from "@tabler/icons-react";
import { z } from "zod";
import { Club } from "~/server/club/types";
import { api } from "~/trpc/react";
import { handleDefaultMutationError, notifySuccess } from "~/client/logger";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";
import type { MembershipCampaign } from "~/server/membershipCampaign/types";
import { Maybe } from "~/utils/types";

type CampaignFormProps = {
  club: Club;
  campaign?: Maybe<MembershipCampaign>;
  onCancel: () => void;
  onSuccess: () => void;
};

// Form schema matches the input schemas
const FormSchema = z.object({
  targetNumberOfMemberships: z
    .number()
    .min(2, "Minimum 2 members required")
    .max(999, "Maximum 999 members allowed"),
  budgetItems: z
    .array(
      z.object({
        label: z.string().min(1, "Required"),
        costPerMonthInUSD: z.number().min(1).max(999)
      })
    )
    .min(1, "At least one budget item is required")
    .max(5, "Maximum 5 budget items allowed"),
  targetDate: z.preprocess(
    (val) => {
      // Handle various input types
      if (val instanceof Date) return val;
      if (typeof val === "string" && val) return new Date(val);
      return val;
    },
    z
      .date({
        required_error: "Target date is required",
        invalid_type_error: "Invalid date format"
      })
      .refine(
        (date) => {
          const today = new Date();
          const minDate = new Date(today);
          minDate.setDate(today.getDate() + 14);
          const maxDate = new Date(today);
          maxDate.setDate(today.getDate() + 60);

          return date >= minDate && date <= maxDate;
        },
        {
          message: "Target date must be between 14 and 60 days from today"
        }
      )
  )
});

type FormData = z.infer<typeof FormSchema>;

export default function CampaignForm({
  club,
  campaign,
  onCancel,
  onSuccess
}: CampaignFormProps) {
  const utils = api.useUtils();
  const isEditing = !!campaign;

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
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      targetNumberOfMemberships: campaign?.targetNumberOfMemberships || 10,
      budgetItems: campaign?.budgetItems || [
        { label: "", costPerMonthInUSD: 0 }
      ],
      targetDate: campaign ? new Date(campaign.targetDate) : undefined
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "budgetItems"
  });

  const onSubmit = async (data: FormData) => {
    if (isEditing && campaign) {
      await updateCampaign.mutateAsync({
        id: campaign.id,
        input: data
      });
    } else {
      await createCampaign.mutateAsync({
        clubId: club.id,
        input: data
      });
    }
  };

  const isLoading = createCampaign.isPending || updateCampaign.isPending;

  // Calculate total
  const budgetItems = fields as Array<{
    label: string;
    costPerMonthInUSD: number;
  }>;
  const total = budgetItems.reduce(
    (sum, item) => sum + (item.costPerMonthInUSD || 0),
    0
  );

  return (
    <Card p="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="lg">
          <Group justify="space-between">
            <Title order={3}>
              {isEditing ? "Edit Campaign" : "Create Campaign"}
            </Title>
            <ColorSchemeAwareActionIcon onClick={onCancel}>
              <IconArrowLeft size={16} />
            </ColorSchemeAwareActionIcon>
          </Group>

          <Controller
            name="targetNumberOfMemberships"
            control={control}
            render={({ field }) => (
              <NumberInput
                {...field}
                label="Target Number of Members"
                placeholder="10"
                description="Number of members you want to reach (2-999)"
                min={2}
                max={999}
                error={errors.targetNumberOfMemberships?.message}
                required
              />
            )}
          />

          <Controller
            name="targetDate"
            control={control}
            render={({ field }) => {
              // Calculate date constraints: 14-60 days from today
              const today = new Date();
              const minDate = new Date(today);
              minDate.setDate(today.getDate() + 14); // 14 days from now
              const maxDate = new Date(today);
              maxDate.setDate(today.getDate() + 60); // 60 days from now

              return (
                <DateInput
                  label="Target Date"
                  placeholder="Select target date"
                  value={field.value || null}
                  onChange={(value) => {
                    // DateInput returns null when cleared, Date when selected
                    field.onChange(value);
                  }}
                  onBlur={field.onBlur}
                  minDate={minDate}
                  maxDate={maxDate}
                  error={errors.targetDate?.message}
                  description="Select a date between 14 and 60 days from today"
                  weekendDays={[]} // This removes the special weekend styling
                  required
                  clearable={false} // Prevent clearing the date once selected
                />
              );
            }}
          />

          <Box>
            <Group justify="space-between" mb="sm">
              <Box>
                <Text fw={500}>Budget Items</Text>
              </Box>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={() => append({ label: "", costPerMonthInUSD: 0 })}
                disabled={fields.length >= 5}
              >
                Add Item
              </Button>
            </Group>

            <Stack gap="sm">
              {fields.map((field, index) => (
                <Card key={field.id} p="sm" withBorder>
                  <Group gap="sm" align="flex-start">
                    <Controller
                      name={`budgetItems.${index}.label`}
                      control={control}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          placeholder="Budget item description"
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
                          placeholder="0.00"
                          prefix="$"
                          suffix="/month"
                          decimalScale={2}
                          fixedDecimalScale
                          min={1}
                          max={999}
                          error={
                            errors.budgetItems?.[index]?.costPerMonthInUSD
                              ?.message
                          }
                          w={150}
                        />
                      )}
                    />
                    <ColorSchemeAwareActionIcon
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                    >
                      <IconX size={16} />
                    </ColorSchemeAwareActionIcon>
                  </Group>
                </Card>
              ))}
              {errors.budgetItems?.message && (
                <Text c="red" size="sm">
                  {errors.budgetItems.message}
                </Text>
              )}
            </Stack>

            <Group justify="flex-end" mt="md">
              <Text size="sm" fw={500}>
                Total: ${total.toFixed(2)}/month
              </Text>
            </Group>
          </Box>

          <Group justify="center" gap="sm">
            <Button variant="default" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              leftSection={<IconDeviceFloppy size={16} />}
            >
              {isEditing ? "Update Campaign" : "Create Campaign"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
