import { api } from "~/trpc/react";
import {
  Badge,
  Group,
  Paper,
  Stack,
  Title,
  Text,
  Button,
  ActionIcon,
  Space,
  Box,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Slider,
  TitleOrder
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import {
  Club,
  LongTextSchema,
  MembershipTier,
  MembershipTierNameSchema,
  MonetaryValueSchema
} from "~/server/service/types";
import React from "react";
import { AlertMessage } from "~/client/components/AlertMessage";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";

type MembershipsPanelProps = {
  club: Club;
};

export function MembershipsPanel({ club }: MembershipsPanelProps) {
  const [opened, { open, close }] = useDisclosure(false);

  const publishedTiers = club.membershipTiers.filter(
    (tier) => tier.status === "PUBLISHED"
  );
  const unpublishedTiers = club.membershipTiers.filter(
    (tier) => tier.status === "UNPUBLISHED"
  );

  return (
    <Stack mt={"lg"} pb={"xl"}>
      <Title order={4}>Active Tiers</Title>

      <Box style={{ overflowX: "auto" }}>
        <Group wrap="nowrap" style={{ minWidth: "min-content" }}>
          {publishedTiers.map((t) => (
            <MembershipTierCard
              key={t.id}
              clubId={club.id}
              membershipTier={t}
            />
          ))}

          <ActionIcon
            variant="light"
            color={"black"}
            onClick={open}
            w={300}
            h={400}
          >
            <IconPlus />
          </ActionIcon>
        </Group>
      </Box>

      <CreateMembershipTierModal
        clubId={club.id}
        opened={opened}
        handleClose={close}
      />

      {unpublishedTiers.length !== 0 && (
        <Stack>
          <Title order={4} mt="xl">
            Inactive Tiers
          </Title>
          <Box style={{ overflowX: "auto" }}>
            <Group wrap="nowrap" style={{ minWidth: "min-content" }}>
              {unpublishedTiers.map((t) => (
                <MembershipTierCard
                  key={t.id}
                  clubId={club.id}
                  membershipTier={t}
                />
              ))}
            </Group>
          </Box>
        </Stack>
      )}
    </Stack>
  );
}

type CreateMembershipTierModalProps = {
  clubId: number;
  opened: boolean;
  handleClose: () => void;
};

function CreateMembershipTierModal({
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
      costPerMonthInUSD: 20
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
            defaultValue={20}
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

type MembershipTierCardProps = {
  clubId: number;
  membershipTier: MembershipTier;
};

export function MembershipTierCard({
  clubId,
  membershipTier
}: MembershipTierCardProps) {
  const utils = api.useUtils();

  const publishMembershipTier = api.main.publishMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: clubId });
      utils.main.userOwnedClubs.invalidate();
    }
  });
  const unpublishMembershipTier = api.main.unpublishMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: clubId });
      utils.main.userOwnedClubs.invalidate();
    }
  });

  const updateMembershipTier = api.main.updateMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: clubId });
      utils.main.userOwnedClubs.invalidate();
    }
  });
  const deleteMembershipTier = api.main.deleteMembershipTier.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: clubId });
      utils.main.userOwnedClubs.invalidate();
    }
  });

  return (
    <Paper key={membershipTier.id} p="md" withBorder h={400} w={300}>
      <Stack h="100%" gap={4}>
        {membershipTier.status === "PUBLISHED" ? (
          <Badge color="green" style={{ alignSelf: "flex-end" }}>
            Active
          </Badge>
        ) : (
          <Badge color="red" style={{ alignSelf: "flex-end" }}>
            Inactive
          </Badge>
        )}

        <Title order={4} mt={4}>
          {membershipTier.name}
        </Title>

        <Stack gap={4}>
          <Title order={6}>Contributions</Title>
          {membershipTier.contributionDescription === "" ? (
            <Box mb={50}>
              <AlertMessage
                message={"Please update contribution details."}
                size={"sm"}
              />
            </Box>
          ) : (
            <Text size={"sm"} c="dimmed" lineClamp={4}>
              {membershipTier.contributionDescription}
            </Text>
          )}
        </Stack>

        <Stack gap={4} mt={4}>
          <Title order={6}>Benefits</Title>
          {membershipTier.benefitDescription === "" ? (
            <AlertMessage
              message={"Please update benefits details."}
              size={"sm"}
            />
          ) : (
            <Text size={"sm"} c="dimmed" lineClamp={4}>
              {membershipTier.benefitDescription}
            </Text>
          )}
        </Stack>

        <Space flex={1} />

        <Text fw={700} size={"md"} mb={"sm"}>
          ${membershipTier.costPerMonthInUSD}/month
        </Text>

        <Group
          style={{
            alignSelf: "flex-end"
          }}
        >
          <Button onClick={() => {}}>Review</Button>
          {membershipTier.status === "PUBLISHED" ? (
            <Button
              variant="light"
              onClick={async () =>
                await unpublishMembershipTier.mutateAsync({
                  id: membershipTier.id
                })
              }
              disabled={unpublishMembershipTier.isPending}
            >
              Archive
            </Button>
          ) : (
            <Button
              variant="light"
              onClick={async () =>
                await publishMembershipTier.mutateAsync({
                  id: membershipTier.id
                })
              }
              disabled={publishMembershipTier.isPending}
            >
              Publish
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}
