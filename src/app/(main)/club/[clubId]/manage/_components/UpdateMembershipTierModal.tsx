import React, { useState } from "react";
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
  Tooltip,
  SegmentedControl,
  FileButton,
  Image,
  ActionIcon,
  Box
} from "@mantine/core";
import {
  isDefaultFreeTier,
  BILLING_INTERVAL_OPTIONS,
  Maybe
} from "~/utils/types";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { z } from "zod";
import {
  handleDefaultMutationError,
  logger,
  notifyError
} from "~/client/logger";
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
import { storageClient } from "~/client/utils/storageClient";
import { isFileSizeValid } from "~/client/components/EditableUserAvatar";
import { stringify } from "~/utils";
import { IconPhoto, IconX } from "@tabler/icons-react";

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
  const [coverImageUrl, setCoverImageUrl] = useState<Maybe<string>>(
    membershipTier.coverImageUrl ?? null
  );
  const [pendingCoverImageUrl, setPendingCoverImageUrl] =
    useState<Maybe<string>>(null);
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);

  const updateMembershipTier = api.main.updateMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: club.id });
      utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
      utils.main.userMemberships.invalidate();
      resetLocalState();
      handleClose();
    },
    onError: handleDefaultMutationError
  });

  const form = useForm({
    initialValues: {
      name: membershipTier.name,
      benefitDescription: membershipTier.benefitDescription,
      costPerBillingInterval: membershipTier.costPerBillingInterval,
      billingInterval: membershipTier.billingInterval,
      initiationFeeCostInUSD: membershipTier.initiationFeeCostInUSD
    },

    validateInputOnChange: true,

    validate: {
      name: (v) => safeValidateSchema(MembershipTierNameSchema, v),
      benefitDescription: (v) => safeValidateSchema(LongTextSchema, v),
      costPerBillingInterval: (v) =>
        safeValidateSchema(MonetaryValueSchema.or(z.literal(0)), v),
      initiationFeeCostInUSD: (v) =>
        safeValidateSchema(MonetaryValueSchema.nullable(), v)
    }
  });

  const resetLocalState = () => {
    form.setValues({
      name: membershipTier.name,
      benefitDescription: membershipTier.benefitDescription,
      costPerBillingInterval: membershipTier.costPerBillingInterval,
      billingInterval: membershipTier.billingInterval,
      initiationFeeCostInUSD: membershipTier.initiationFeeCostInUSD
    });
    form.resetDirty();
    setPendingCoverImageUrl(null);
  };

  const cleanupPendingCoverImage = async () => {
    if (!pendingCoverImageUrl) return;
    try {
      await storageClient.deleteMembershipTierCoverImage(
        club.id,
        pendingCoverImageUrl
      );
    } catch (e) {
      logger.error(
        stringify(e),
        "failed to clean up membership tier cover image on modal close"
      );
    } finally {
      setPendingCoverImageUrl(null);
    }
  };

  const handleModalClose = () => {
    void cleanupPendingCoverImage();
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
      // Prevents orphaned photos in storage
      if (pendingCoverImageUrl) {
        await storageClient.deleteMembershipTierCoverImage(
          club.id,
          pendingCoverImageUrl
        );
      }

      const url = await storageClient.uploadMembershipTierCoverImage(
        club.id,
        file
      );
      setCoverImageUrl(url);
      setPendingCoverImageUrl(url);
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
      if (pendingCoverImageUrl && coverImageUrl === pendingCoverImageUrl) {
        await storageClient.deleteMembershipTierCoverImage(
          club.id,
          pendingCoverImageUrl
        );
        setPendingCoverImageUrl(null);
      }
      setCoverImageUrl(null);
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

  const isSubmitting = updateMembershipTier.isPending || isUploadingCoverImage;

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      padding={"xl"}
      centered
      styles={{
        content: {
          border: "2px black solid",
          borderRadius: 15,
          maxHeight: "80vh",
          overflowY: "auto"
        }
      }}
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
            radius={4}
            styles={{ input: { borderRadius: 4 } }}
            {...form.getInputProps("name")}
          />

          <Stack gap={12}>
            <SegmentedControl
              data={BILLING_INTERVAL_OPTIONS}
              key={form.key("billingInterval")}
              radius={4}
              {...form.getInputProps("billingInterval")}
            />
          </Stack>

          {!isDefaultFreeTier(membershipTier) && (
            <Stack mt={"-8"}>
              <Stack gap={12}>
                <CostInput
                  value={form.values.costPerBillingInterval}
                  onChange={(value) =>
                    form.setFieldValue("costPerBillingInterval", value)
                  }
                />
              </Stack>

              <Stack gap={12} align="center">
                {form.values.initiationFeeCostInUSD && (
                  <Text
                    c={"gray"}
                    fz="sm"
                    style={{ marginTop: "-12px", marginBottom: "-8px" }}
                  >
                    + one-time initiation fee
                  </Text>
                )}
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

          <Textarea
            placeholder="Describe the benefits members in this tier can expect."
            rows={5}
            key={form.key("benefitDescription")}
            radius={4}
            styles={{ input: { borderRadius: 4 } }}
            {...form.getInputProps("benefitDescription")}
          />

          <Stack gap={8}>
            <Title order={6}>Cover Image (optional)</Title>
            {coverImageUrl ? (
              <Box pos="relative">
                <Image
                  src={coverImageUrl}
                  alt="Cover image preview"
                  radius="md"
                  fit="cover"
                  h={180}
                />
                <ActionIcon
                  size="md"
                  variant="filled"
                  onClick={handleRemoveCoverImage}
                  disabled={isSubmitting}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    backgroundColor: "white",
                    border: "2px solid #000",
                    color: "#000"
                  }}
                >
                  <IconX size={16} />
                </ActionIcon>
              </Box>
            ) : null}
            <Text size="xs" c="dimmed" fs="italic">
              Recommended size: 460 x 200 pixels
            </Text>
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
                    radius={4}
                  >
                    <Group gap={"xs"}>
                      <IconPhoto size={15} />
                      Upload Image
                    </Group>
                  </Button>
                )}
              </FileButton>
            </Group>
          </Stack>

          <Group style={{ alignSelf: "center" }}>
            <UpdateMembershipTierButton
              clubId={club.id}
              membershipTierId={membershipTier.id}
              isLoading={updateMembershipTier.isPending}
              isSubmitting={isSubmitting}
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
  isSubmitting: boolean;
};

function UpdateMembershipTierButton({
  clubId,
  membershipTierId,
  isLoading,
  isSubmitting
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
      disabled={isSubmitting}
      radius={4}
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
        radius={4}
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
