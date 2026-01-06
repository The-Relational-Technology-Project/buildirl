import { api } from "~/trpc/react";
import {
  Badge,
  Box,
  Button,
  Center,
  ActionIcon,
  FileButton,
  Group,
  Image,
  Modal,
  Paper,
  Space,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
  useMatches,
  useMantineColorScheme
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import {
  Club,
  ContributionReason,
  ContributionReasonSchema
} from "~/server/club/types";
import { MembershipTier } from "~/server/membershipTier/types";
import React, { useEffect, useState } from "react";
import AlertMessage from "~/client/components/AlertMessage";
import { useDisclosure } from "@mantine/hooks";
import CreateMembershipTierModal from "~/app/(main)/club/[clubId]/manage/_components/CreateMembershipTierModal";
import UpdateMembershipTierModal from "~/app/(main)/club/[clubId]/manage/_components/UpdateMembershipTierModal";
import SetupStripeConnectModal from "~/app/(main)/club/[clubId]/manage/_components/SetupStripeConnectModal";
import { Carousel } from "@mantine/carousel";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";
import { QueryError } from "~/client/utils/QueryError";
import { billingIntervalLabel, isLoaded } from "~/client/utils";
import {
  handleDefaultMutationError,
  logger,
  notifyError
} from "~/client/logger";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import { storageClient } from "~/client/utils/storageClient";
import { isFileSizeValid } from "~/client/components/EditableUserAvatar";
import { stringify } from "~/utils";
import { Maybe } from "~/utils/types";
import { IconX } from "@tabler/icons-react";

type ManageMembershipsPanelProps = {
  club: Club;
};

export default function ManageMembershipTiersPanel({
  club
}: ManageMembershipsPanelProps) {
  const [
    createModalOpened,
    { open: openCreateModal, close: closeCreateModal }
  ] = useDisclosure(false);
  const [
    stripeModalOpened,
    { open: openStripeModal, close: closeStripeModal }
  ] = useDisclosure(false);
  const [
    contributionModalOpened,
    { open: openContributionModal, close: closeContributionModal }
  ] = useDisclosure(false);
  const [editingContributionReason, setEditingContributionReason] =
    useState<Maybe<{ reason: ContributionReason; index: number }>>(null);

  const isMobile = useMatches({ base: true, md: false });
  const withCarouselControls = useMatches({ base: false, md: true });
  const { colorScheme } = useMantineColorScheme();
  const desktopTitlePadding = isMobile ? 0 : 36;

  const accountStatus = api.payments.accountStatus.useQuery(
    { clubId: club.id },
    {
      // refetch every 1 minute as data can be changed externally in Stripe
      refetchInterval: 60 * 1000
    }
  );

  QueryError.checkNullable({
    result: accountStatus,
    fieldName: "accountStatus"
  });

  if (!isLoaded(accountStatus)) {
    return;
  }

  const publishedTiers = club.membershipTiers.filter(
    (tier) => tier.status === "PUBLISHED"
  );
  const unpublishedTiers = club.membershipTiers.filter(
    (tier) => tier.status === "UNPUBLISHED"
  );
  const contributionReasons = club.contributionReasons.items;
  const contributionSlideCount = contributionReasons.length + 1;
  const showContributionIndicators = isMobile && contributionSlideCount > 1;
  const handleCreateContributionCardClick = () => {
    setEditingContributionReason(null);
    openContributionModal();
  };
  const handleEditContributionCardClick = (
    reason: ContributionReason,
    index: number
  ) => {
    setEditingContributionReason({ reason, index });
    openContributionModal();
  };
  const handleContributionModalClose = () => {
    setEditingContributionReason(null);
    closeContributionModal();
  };

  const handleCreateTierClick = () => {
    // do not allow create and prompt for Stripe Connect setup
    // if not complete
    if (null === accountStatus.data || !accountStatus.data!.isComplete) {
      openStripeModal();
    } else {
      openCreateModal();
    }
  };

  return (
    <Stack py={"lg"} pb={"xl"} gap={"lg"}>
      <Box px={desktopTitlePadding}>
        <Title order={3}>Active Tiers</Title>
      </Box>

      <Carousel
        slideSize="33.333333%"
        slideGap="md"
        align={isMobile ? "center" : "start"}
        // we need indicators for mobile because
        // the next and previous card are not visible
        withControls={withCarouselControls}
        withIndicators={isMobile && publishedTiers.length > 1}
        // we do not want carousel to move when arrows are pressed in
        // update / create membership tier modals
        withKeyboardEvents={false}
        // shifts the indicator down
        pb={{ base: 60, md: 0 }}
        px={{ base: 0, md: 72 }}
        styles={{
          // TODO! there is a bug with default control color in the deployed environments
          //  change the control color to make it visible
          control: {
            width: "3rem",
            height: "3rem",
            backgroundColor: "white",
            color: "black",
            opacity: 1,
            border: "2px solid",
            borderColor: "black",
            borderRadius: "4px"
          },
          ...(isMobile && publishedTiers.length > 1
            ? {
                indicator: {
                  backgroundColor: `${colorScheme === "dark" ? "white" : "black"}`,
                  width: 8,
                  height: 8
                }
              }
            : {})
        }}
      >
        {publishedTiers.map((t) => (
          <Carousel.Slide key={t.id} py={4}>
            <ManageMembershipTierCard
              club={club}
              membershipTier={t}
              // a trick because we know this is only true if there is
              // only 1 remaining published tier and if so this must be
              // that tier
              isLastPublished={publishedTiers.length === 1}
            />
          </Carousel.Slide>
        ))}

        <Carousel.Slide py={4}>
          <Paper
            h={420}
            w={300}
            radius={15}
            bd={"2px black solid"}
            onClick={handleCreateTierClick}
            style={{
              boxShadow: "4px 4px 0 #000",
              cursor: "pointer"
            }}
          >
            <Center h={"100%"}>
              <Stack gap={8} align="center">
                <ColorSchemeAwareActionIcon
                  variant="transparent"
                  onClick={handleCreateTierClick}
                >
                  <IconPlus />
                </ColorSchemeAwareActionIcon>
                <Text fw={600}>New tier</Text>
              </Stack>
            </Center>
          </Paper>
        </Carousel.Slide>
      </Carousel>

      <CreateMembershipTierModal
        club={club}
        opened={createModalOpened}
        handleClose={closeCreateModal}
      />

      <SetupStripeConnectModal
        clubId={club.id}
        opened={stripeModalOpened}
        handleClose={closeStripeModal}
      />

      <Stack gap={"sm"} mt="md">
        <Box px={desktopTitlePadding}>
          <Title order={3}>Contribution Cards</Title>
          <Text size="sm" c="dimmed">
            People are more inclined to contribute when they know what their
            money is going towards (food, venue, events, etc).
          </Text>
        </Box>

        <Carousel
          slideSize="33.333333%"
          slideGap="md"
          align={isMobile ? "center" : "start"}
          withControls={withCarouselControls}
          withIndicators={showContributionIndicators}
          withKeyboardEvents={false}
          pb={{ base: 60, md: 0 }}
          px={{ base: 0, md: 72 }}
          styles={{
            control: {
              width: "3rem",
              height: "3rem",
              backgroundColor: "white",
              color: "black",
              opacity: 1,
              border: "2px solid",
              borderColor: "black",
              borderRadius: "4px"
            },
            ...(showContributionIndicators
              ? {
                  indicator: {
                    backgroundColor: `${colorScheme === "dark" ? "white" : "black"}`,
                    width: 8,
                    height: 8
                  }
                }
              : {})
          }}
        >
          {contributionReasons.map((reason, index) => (
            <Carousel.Slide key={`${reason.label}-${index}`} py={4}>
              <ContributionCard
                contributionReason={reason}
                onEdit={() => handleEditContributionCardClick(reason, index)}
              />
            </Carousel.Slide>
          ))}

          <Carousel.Slide py={4}>
            <Paper
              h={420}
              w={300}
              radius={15}
              bd={"2px black solid"}
              onClick={handleCreateContributionCardClick}
              style={{
                boxShadow: "4px 4px 0 #000",
                cursor: "pointer"
              }}
            >
              <Center h={"100%"}>
                <Stack gap={8} align="center">
                  <ColorSchemeAwareActionIcon
                    variant="transparent"
                    onClick={handleCreateContributionCardClick}
                  >
                    <IconPlus />
                  </ColorSchemeAwareActionIcon>
                  <Text fw={600}>Add contribution card</Text>
                </Stack>
              </Center>
            </Paper>
          </Carousel.Slide>
        </Carousel>
      </Stack>

      <ContributionCardModal
        club={club}
        opened={contributionModalOpened}
        handleClose={handleContributionModalClose}
        mode={editingContributionReason ? "edit" : "create"}
        contributionToEdit={editingContributionReason}
      />

      {unpublishedTiers.length !== 0 && (
        <Stack gap={"sm"}>
          <Box px={desktopTitlePadding}>
            <Title order={3} mt="md">
              Inactive Tiers
            </Title>
          </Box>

          <Carousel
            slideSize="33.333333%"
            slideGap="md"
            align={isMobile ? "center" : "start"}
            withControls={withCarouselControls}
            withIndicators={isMobile && unpublishedTiers.length > 1}
            withKeyboardEvents={false}
            pb={{ base: 60, md: 0 }}
            px={{ base: 0, md: 72 }}
            styles={{
              control: {
                width: "3rem",
                height: "3rem",
                backgroundColor: "white",
                color: "black",
                opacity: 1,
                border: "2px solid",
                borderColor: "black",
                borderRadius: "4px"
              },
              ...(isMobile && unpublishedTiers.length > 1
                ? {
                    indicator: {
                      backgroundColor: `${colorScheme === "dark" ? "white" : "black"}`,
                      width: 8,
                      height: 8
                    }
                  }
                : {})
            }}
          >
            {unpublishedTiers.map((t) => (
              <Carousel.Slide key={t.id} p={4}>
                <ManageMembershipTierCard
                  club={club}
                  membershipTier={t}
                  // not published!
                  isLastPublished={false}
                />
              </Carousel.Slide>
            ))}
          </Carousel>
        </Stack>
      )}
    </Stack>
  );
}

const FALLBACK_CARD_BACKGROUND =
  "linear-gradient(135deg, #1f1b2c 0%, #5a3b33 45%, #d47d38 100%)";

type ContributionCardProps = {
  contributionReason: ContributionReason;
  onEdit?: () => void;
};

function ContributionCard({
  contributionReason,
  onEdit
}: ContributionCardProps) {
  return (
    <Paper
      h={420}
      w={300}
      radius={15}
      bd={"2px black solid"}
      style={{
        boxShadow: "4px 4px 0 #000",
        position: "relative"
      }}
    >
      {onEdit ? (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2
          }}
        >
          Edit
        </Button>
      ) : null}
      <Stack h="100%" gap={0} style={{ overflow: "hidden" }}>
        <Box
          p={16}
          style={{
            flex: 1,
            height: "50%",
            boxSizing: "border-box"
          }}
        >
          <Box
            style={{
              height: "100%",
              width: "100%",
              position: "relative",
              backgroundImage: contributionReason.coverImageUrl
                ? `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.08)), url(${contributionReason.coverImageUrl})`
                : FALLBACK_CARD_BACKGROUND,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 13,
              border: "2px black solid",
              overflow: "hidden"
            }}
          >
            <Center h="100%">
              <Text
                fw={800}
                size="sm"
                px={16}
                py={8}
                style={{
                  backgroundColor: "#d5ed65",
                  borderRadius: 999,
                  border: "2px solid #0d0d0d",
                  letterSpacing: 0.5
                }}
              >
                {contributionReason.label.toUpperCase()}
              </Text>
            </Center>
          </Box>
        </Box>
        <Stack
          style={{ flex: 1, letterSpacing: -0.15 }}
          gap={10}
          px="lg"
          pb="md"
        >
          <Text size="sm" lh={1.6}>
            {contributionReason.description}
          </Text>
        </Stack>
      </Stack>
    </Paper>
  );
}

type ContributionCardModalProps = {
  club: Club;
  opened: boolean;
  handleClose: () => void;
  mode: "create" | "edit";
  contributionToEdit: Maybe<{ reason: ContributionReason; index: number }>;
};

function ContributionCardModal({
  club,
  opened,
  handleClose,
  mode,
  contributionToEdit
}: ContributionCardModalProps) {
  const contributionReasonToEdit = contributionToEdit?.reason ?? null;
  const contributionReasonIndex = contributionToEdit?.index ?? null;
  const isEditMode = mode === "edit";
  const utils = api.useUtils();
  const [coverImageUrl, setCoverImageUrl] = useState<Maybe<string>>(null);
  const [originalCoverImageUrl, setOriginalCoverImageUrl] =
    useState<Maybe<string>>(null);
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);

  const form = useForm({
    initialValues: {
      label: "",
      description: ""
    },
    validateInputOnChange: true,
    validate: {
      label: (v) => safeValidateSchema(ContributionReasonSchema.shape.label, v),
      description: (v) =>
        safeValidateSchema(ContributionReasonSchema.shape.description, v)
    }
  });

  const resetLocalState = () => {
    form.reset();
    setCoverImageUrl(null);
    setOriginalCoverImageUrl(null);
  };

  useEffect(() => {
    if (!opened) return;

    const values =
      isEditMode && contributionReasonToEdit
        ? {
            label: contributionReasonToEdit.label,
            description: contributionReasonToEdit.description
          }
        : {
            label: "",
            description: ""
          };

    form.setValues(values);
    form.resetDirty(values);
    setCoverImageUrl(contributionReasonToEdit?.coverImageUrl ?? null);
    setOriginalCoverImageUrl(contributionReasonToEdit?.coverImageUrl ?? null);
  }, [
    opened,
    isEditMode,
    contributionReasonToEdit?.label,
    contributionReasonToEdit?.description,
    contributionReasonToEdit?.coverImageUrl
  ]);

  const updateContributionReasons =
    api.main.updateClubContributionReasons.useMutation({
      onSuccess: () => {
        utils.main.club.invalidate({ id: club.id });
        utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
      },
      onError: handleDefaultMutationError
    });

  const isSubmitting =
    updateContributionReasons.isPending || isUploadingCoverImage;
  const submitButtonLabel = isEditMode ? "Save changes" : "Create Card";

  const cleanupUnsavedCoverImage = async () => {
    if (!coverImageUrl) return;
    if (isEditMode && coverImageUrl === originalCoverImageUrl) {
      return;
    }
    try {
      await storageClient.deleteMembershipTierCoverImage(
        club.id,
        coverImageUrl
      );
    } catch (e) {
      logger.error(
        stringify(e),
        "failed to clean up contribution cover image on modal close"
      );
    } finally {
      setCoverImageUrl(originalCoverImageUrl);
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
      if (coverImageUrl && coverImageUrl !== originalCoverImageUrl) {
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
    } catch (e) {
      logger.error(
        stringify(e),
        `failed to upload contribution cover image ${(file as File).name}`
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
      if (coverImageUrl !== originalCoverImageUrl || !isEditMode) {
        await storageClient.deleteMembershipTierCoverImage(
          club.id,
          coverImageUrl
        );
      }
      setCoverImageUrl(null);
      if (coverImageUrl === originalCoverImageUrl) {
        setOriginalCoverImageUrl(null);
      }
    } catch (e) {
      logger.error(stringify(e), "failed to delete contribution cover image");
      notifyError("Could not delete cover image. Please try again.");
    } finally {
      setIsUploadingCoverImage(false);
    }
  };

  const handleRemoveContributionCard = async () => {
    if (!isEditMode || contributionReasonIndex === null) return;

    const updatedItems = club.contributionReasons.items.filter(
      (_, idx) => idx !== contributionReasonIndex
    );

    try {
      await updateContributionReasons.mutateAsync({
        clubId: club.id,
        input: { items: updatedItems }
      });

      const imagesToDelete = Array.from(
        new Set(
          [coverImageUrl, originalCoverImageUrl].filter((url): url is string =>
            Boolean(url)
          )
        )
      );

      await Promise.all(
        imagesToDelete.map(async (url) => {
          try {
            await storageClient.deleteMembershipTierCoverImage(club.id, url);
          } catch (e) {
            logger.error(
              stringify(e),
              "failed to delete contribution cover image on remove"
            );
          }
        })
      );

      resetLocalState();
      handleClose();
    } catch {
      // errors handled via onError
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      padding={"xl"}
      centered
      styles={{
        content: {
          borderRadius: 15,
          border: "2px black solid",
          maxHeight: "80vh",
          overflowY: "auto"
        }
      }}
      title={
        <Text size={"xl"} fw={700}>
          {isEditMode ? "Update Contribution Card" : "Create Contribution Card"}
        </Text>
      }
    >
      <form
        onSubmit={form.onSubmit(async (v) => {
          if (isEditMode && contributionReasonIndex === null) {
            notifyError(
              "Unable to update this contribution card. Please try again."
            );
            return;
          }
          const updatedItems =
            isEditMode && contributionReasonIndex !== null
              ? club.contributionReasons.items.map((item, idx) =>
                  idx === contributionReasonIndex
                    ? {
                        label: v.label,
                        description: v.description,
                        coverImageUrl: coverImageUrl ?? null
                      }
                    : item
                )
              : [
                  ...club.contributionReasons.items,
                  {
                    label: v.label,
                    description: v.description,
                    coverImageUrl: coverImageUrl ?? null
                  }
                ];

          await updateContributionReasons.mutateAsync({
            clubId: club.id,
            input: {
              items: updatedItems
            }
          });

          if (
            isEditMode &&
            originalCoverImageUrl &&
            originalCoverImageUrl !== coverImageUrl
          ) {
            try {
              await storageClient.deleteMembershipTierCoverImage(
                club.id,
                originalCoverImageUrl
              );
            } catch (e) {
              logger.error(
                stringify(e),
                "failed to delete old contribution cover image after update"
              );
            }
          }

          resetLocalState();
          handleClose();
        })}
      >
        <Stack>
          <TextInput
            placeholder="Contribution card label"
            required
            key={form.key("label")}
            radius={4}
            styles={{ input: { borderRadius: 4 } }}
            {...form.getInputProps("label")}
          />

          <Textarea
            placeholder="Why should members contribute? Add some color."
            rows={5}
            key={form.key("description")}
            radius={4}
            styles={{ input: { borderRadius: 4 } }}
            {...form.getInputProps("description")}
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
                  >
                    Upload Image
                  </Button>
                )}
              </FileButton>
            </Group>
          </Stack>

          <Group gap={"md"} mt="sm" justify="center">
            <Button
              type="submit"
              loading={updateContributionReasons.isPending}
              disabled={isUploadingCoverImage}
            >
              {submitButtonLabel}
            </Button>
            {isEditMode ? (
              <Button
                variant="filled"
                color="red"
                onClick={handleRemoveContributionCard}
                disabled={isSubmitting}
                loading={updateContributionReasons.isPending}
              >
                Delete
              </Button>
            ) : (
              <Space w={8} />
            )}
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

function costDisplayText(membershipTier: MembershipTier) {
  const cost = membershipTier.costPerBillingInterval;
  const interval = billingIntervalLabel(membershipTier.billingInterval);
  const initiationFee = membershipTier.initiationFeeCostInUSD;

  let text = `$${cost} / ${interval}`;
  if (initiationFee !== null && initiationFee > 0) {
    text += ` + $${initiationFee} initiation`;
  }
  return text;
}

type ManageMembershipTierCardProps = {
  club: Club;
  membershipTier: MembershipTier;
  isLastPublished: boolean;
};

export function ManageMembershipTierCard({
  club,
  membershipTier,
  isLastPublished
}: ManageMembershipTierCardProps) {
  const [opened, { open, close }] = useDisclosure(false);

  const utils = api.useUtils();

  const publishMembershipTier = api.main.publishMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: club.id });
      utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
      utils.main.userMemberships.invalidate();
    },
    onError: handleDefaultMutationError
  });
  const unpublishMembershipTier = api.main.unpublishMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: club.id });
      utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
      utils.main.userMemberships.invalidate();
    },
    onError: handleDefaultMutationError
  });

  return (
    <Paper
      key={membershipTier.id}
      h={420}
      w={300}
      radius={15}
      bd={"2px black solid"}
      style={{
        boxShadow: "4px 4px 0 #000"
      }}
    >
      <Stack h="100%" gap={4} style={{ overflow: "hidden" }}>
        <Box
          h={200}
          style={{
            position: "relative",
            backgroundImage: membershipTier.coverImageUrl
              ? `linear-gradient(180deg, rgba(0,0,0,0.16), rgba(0,0,0,0.16)), url(${membershipTier.coverImageUrl})`
              : "linear-gradient(135deg, #1f1b2c 0%, #5a3b33 45%, #d47d38 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderTopLeftRadius: 13,
            borderTopRightRadius: 13,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            overflow: "hidden"
          }}
        >
          <Badge
            color={membershipTier.status === "PUBLISHED" ? "green" : "red"}
            style={{
              position: "absolute",
              top: 10,
              right: 10
            }}
          >
            {membershipTier.status === "PUBLISHED" ? "Active" : "Inactive"}
          </Badge>
        </Box>
        <Stack h="100%" gap={4} px="lg" pb="md">
          <Title order={4} mt={4}>
            {membershipTier.name}
          </Title>

          <Stack style={{ overflowY: "auto" }}>
            <Stack gap={4}>
              <Title order={6}>Our member experience</Title>
              <Box mih={60}>
                {membershipTier.benefitDescription === "" ? (
                  <AlertMessage
                    message={"Please update benefits details."}
                    size={"sm"}
                  />
                ) : (
                  <Text size={"sm"}>{membershipTier.benefitDescription}</Text>
                )}
              </Box>
            </Stack>
          </Stack>

          <Space flex={1} />

          <Text fw={700} size={"md"} mb={"sm"}>
            {costDisplayText(membershipTier)}
          </Text>

          <Group
            style={{
              alignSelf: "flex-end"
            }}
          >
            <Button onClick={open}>Edit</Button>

            <UpdateMembershipTierModal
              club={club}
              membershipTier={membershipTier}
              isLastPublished={isLastPublished}
              opened={opened}
              handleClose={close}
            />

            {membershipTier.status === "PUBLISHED" ? (
              <Tooltip
                position={"bottom"}
                label={"There must be at least one active published tier."}
                hidden={!isLastPublished}
              >
                <Button
                  variant="light"
                  onClick={async () =>
                    await unpublishMembershipTier.mutateAsync({
                      id: membershipTier.id
                    })
                  }
                  loading={unpublishMembershipTier.isPending}
                  disabled={isLastPublished}
                >
                  Archive
                </Button>
              </Tooltip>
            ) : (
              <Button
                variant="light"
                onClick={async () =>
                  await publishMembershipTier.mutateAsync({
                    id: membershipTier.id
                  })
                }
                loading={publishMembershipTier.isPending}
              >
                Publish
              </Button>
            )}
          </Group>
        </Stack>
      </Stack>
    </Paper>
  );
}
