import React, { useState } from "react";
import { api } from "~/trpc/react";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import { LongTextSchema, MonetaryValueSchema } from "~/server/utils/types";
import { Club } from "~/server/club/types";
import { MembershipTierNameSchema } from "~/server/membershipTier/types";
import {
  Button,
  FileButton,
  Group,
  Image,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title
} from "@mantine/core";
import {
  handleDefaultMutationError,
  logger,
  notifyError
} from "~/client/logger";
import {
  Maybe,
  BillingInterval,
  BILLING_INTERVAL_OPTIONS
} from "~/utils/types";
import {
  CostInput,
  DEFAULT_COST_PER_MONTH_USD,
  DEFAULT_INITIATION_FEE_USD,
  NullableCostInput
} from "~/app/(main)/club/[clubId]/manage/_components/CostInput";
import { storageClient } from "~/client/utils/storageClient";
import { isFileSizeValid } from "~/client/components/EditableUserAvatar";
import { stringify } from "~/utils";

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
  const [coverImageUrl, setCoverImageUrl] = useState<Maybe<string>>(null);
  const [coverImageName, setCoverImageName] = useState("");
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);

  const form = useForm({
    initialValues: {
      name: "",
      benefitDescription: "",
      costPerBillingInterval: DEFAULT_COST_PER_MONTH_USD,
      billingInterval: BillingInterval.MONTHLY,
      initiationFeeCostInUSD: null as Maybe<number>
    },

    validateInputOnChange: true,

    validate: {
      name: (v) => safeValidateSchema(MembershipTierNameSchema, v),
      benefitDescription: (v) => safeValidateSchema(LongTextSchema, v),
      costPerBillingInterval: (v) => safeValidateSchema(MonetaryValueSchema, v),
      initiationFeeCostInUSD: (v) =>
        safeValidateSchema(MonetaryValueSchema.nullable(), v)
    }
  });

  const resetLocalState = () => {
    form.reset();
    setCoverImageUrl(null);
    setCoverImageName("");
  };

  const createMembershipTier = api.main.createMembershipTier.useMutation({
    onSuccess: (_, v) => {
      utils.main.club.invalidate({ id: v.clubId });
      utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
      utils.main.userMemberships.invalidate();
      resetLocalState();
      handleClose();
    },
    onError: handleDefaultMutationError
  });
  const isSubmitting = createMembershipTier.isPending || isUploadingCoverImage;

  const cleanupUnsavedCoverImage = async () => {
    if (!coverImageUrl) return;
    try {
      await storageClient.deleteMembershipTierCoverImage(
        club.id,
        coverImageUrl
      );
    } catch (e) {
      logger.error(
        stringify(e),
        "failed to clean up membership tier cover image on modal close"
      );
    } finally {
      setCoverImageUrl(null);
      setCoverImageName("");
    }
  };

  const handleModalClose = () => {
    void cleanupUnsavedCoverImage();
    resetLocalState();
    handleClose();
  };

  const handleCoverUpload = async (file: Maybe<File>) => {
    if (!file) return;

    if (!isFileSizeValid(file, 5)) {
      return;
    }
    if (!file.type?.startsWith("image/")) {
      notifyError("Please upload an image file.");
      return;
    }

    setIsUploadingCoverImage(true);
    try {
      if (coverImageUrl) {
        await storageClient.deleteMembershipTierCoverImage(
          club.id,
          coverImageUrl
        );
      }
      const url = await storageClient.uploadMembershipTierCoverImage(
        club.id,
        file
      );
      setCoverImageUrl(url);
      setCoverImageName(file.name);
    } catch (e) {
      logger.error(
        stringify(e),
        `failed to upload membership tier cover image ${file.name}`
      );
      notifyError("Could not upload cover image. Please try again.");
    } finally {
      setIsUploadingCoverImage(false);
    }
  };

  const handleRemoveCoverImage = async () => {
    if (!coverImageUrl) return;

    setIsUploadingCoverImage(true);
    try {
      await storageClient.deleteMembershipTierCoverImage(
        club.id,
        coverImageUrl
      );
      setCoverImageUrl(null);
      setCoverImageName("");
    } catch (e) {
      logger.error(
        stringify(e),
        "failed to delete membership tier cover image"
      );
      notifyError("Could not delete cover image. Please try again.");
    } finally {
      setIsUploadingCoverImage(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
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
              contributionDescription: "",
              coverImageUrl: coverImageUrl ?? null,
              costPerBillingInterval: v.costPerBillingInterval,
              billingInterval: v.billingInterval,
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

          <Stack gap={8}>
            <Title order={6}>Cover Image (optional)</Title>
            <Text size="xs" c="dimmed">
              Recommended size: 460 x 200 pixels
            </Text>
            {coverImageUrl ? (
              <Image
                src={coverImageUrl}
                alt="Cover image preview"
                radius="md"
                fit="cover"
                h={180}
              />
            ) : null}
            <Group gap="sm">
              <FileButton
                onChange={handleCoverUpload}
                accept="image/*"
                disabled={isSubmitting}
              >
                {(props) => (
                  <Button
                    {...props}
                    variant="outline"
                    loading={isUploadingCoverImage}
                  >
                    Upload Image
                  </Button>
                )}
              </FileButton>
              {coverImageName ? (
                <Text size="sm" c="dimmed" lineClamp={1}>
                  {coverImageName}
                </Text>
              ) : null}
              {coverImageUrl ? (
                <Button
                  variant="subtle"
                  color="red"
                  onClick={handleRemoveCoverImage}
                  disabled={isSubmitting}
                >
                  Remove
                </Button>
              ) : null}
            </Group>
          </Stack>

          <Stack gap={12}>
            <Title order={6}>Dues Cost</Title>
            <CostInput
              value={form.values.costPerBillingInterval}
              onChange={(value) =>
                form.setFieldValue("costPerBillingInterval", value)
              }
              defaultValue={DEFAULT_COST_PER_MONTH_USD}
            />
          </Stack>

          <Stack gap={12}>
            <Title order={6}>Dues Frequency</Title>
            <SegmentedControl
              data={BILLING_INTERVAL_OPTIONS}
              key={form.key("billingInterval")}
              {...form.getInputProps("billingInterval")}
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
            disabled={isUploadingCoverImage}
          >
            Create
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
