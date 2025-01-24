import {
  Club,
  ClubNameSchema,
  ClubPublicIdSchema,
  ClubTagLineSchema,
  InstagramHandleSchema,
  LongTextSchema,
  URLSchema
} from "~/server/service/types";
import { api } from "~/trpc/react";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import {
  Button,
  Group,
  Image,
  Modal,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title
} from "@mantine/core";
import React from "react";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";
import { logger, notifyError } from "~/client/logger";
import { useDisclosure } from "@mantine/hooks";

type OverviewPanelProps = {
  club: Club;
};

export function OverviewPanel({ club }: OverviewPanelProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Paper radius="md" p="xl" withBorder mt={20}>
        <Group justify={"flex-start"} align={"stretch"} gap={40}>
          <Image
            radius="md"
            w={300}
            h={300}
            fallbackSrc={"/image-fallback.png"}
          />
          <Stack justify={"space-between"} style={{ flex: 1 }}>
            <Stack gap={6}>
              <Title order={4}>Club Details</Title>
              <Title order={5} mt={2}>
                Name
              </Title>
              <Text>{club.name}</Text>
              <Title order={5}>Tagline</Title>
              {club.tagLine === "" ? (
                <Group gap={4}>
                  <ThemeIcon color={"orange.5"} variant={"white"} size={"xs"}>
                    <IconAlertTriangle />
                  </ThemeIcon>
                  <Text c={"orange.5"}>
                    Please enter tagline and other basic information.
                  </Text>
                </Group>
              ) : (
                <Text>{club.tagLine}</Text>
              )}
            </Stack>
            <Group grow>
              <Button mt={"sm"} onClick={open}>
                Edit Club Page
              </Button>
              <Button
                mt={"sm"}
                onClick={async () => {
                  await copyToClipboard(club.publicId);
                }}
              >
                Share
              </Button>
            </Group>
          </Stack>
        </Group>
      </Paper>

      <Modal opened={opened} onClose={close}>
        <UpdateClubForm club={club} />
      </Modal>
    </>
  );
}

async function copyToClipboard(clubPublicId: string): Promise<void> {
  const url = window.location.origin + "/share/" + clubPublicId;

  try {
    await navigator.clipboard.writeText(url);
    notifications.show({
      title: "Link copied",
      message: "Share link has been copied to clipboard",
      color: "green",
      icon: <IconCheck size="1.1rem" />,
      autoClose: 3000
    });
  } catch (e) {
    logger.error("error while copying to clipboard: " + e);
    notifyError();
  }
}

type UpdateClubFormProps = {
  club: Club;
};

function UpdateClubForm({ club }: UpdateClubFormProps) {
  const utils = api.useUtils();
  const createUser = api.main.createClub.useMutation({
    onSuccess: async () => {
      await utils.main.club.invalidate({ id: club.id });
      await utils.main.userOwnedClubs.invalidate();
    }
  });

  const form = useForm({
    initialValues: {
      publicId: club.publicId,
      name: club.name,
      tagLine: club.tagLine,
      description: club.description,
      websiteURL: club.websiteURL,
      instagramHandle: club.instagramHandle,
      eventCalendarURL: club.eventCalendarURL
    },

    validateInputOnChange: true,

    validate: {
      description: (v) => safeValidateSchema(LongTextSchema, v),
      publicId: (v) => safeValidateSchema(ClubPublicIdSchema, v),
      name: (v) => safeValidateSchema(ClubNameSchema, v),
      tagLine: (v) => safeValidateSchema(ClubTagLineSchema, v),
      websiteURL: (v) => safeValidateSchema(URLSchema.nullable(), v),
      instagramHandle: (v) =>
        safeValidateSchema(InstagramHandleSchema.nullable(), v),
      eventCalendarURL: (v) => safeValidateSchema(URLSchema.nullable(), v)
    }
  });

  return (
    <form
      onSubmit={form.onSubmit(
        async ({
          publicId,
          name,
          tagLine,
          description,
          websiteURL,
          instagramHandle,
          eventCalendarURL
        }) => {
          await createUser.mutateAsync({
            publicId: publicId,
            name: name,
            tagLine: tagLine,
            description: description,
            websiteURL: websiteURL === "" ? null : websiteURL,
            instagramHandle: instagramHandle === "" ? null : instagramHandle,
            eventCalendarURL: eventCalendarURL === "" ? null : eventCalendarURL
          });
        }
      )}
    >
      <Stack p={"md"} gap={8}>
        <TextInput
          required
          placeholder="Club name"
          value={form.values.name}
          onChange={(event) =>
            form.setFieldValue("name", event.currentTarget.value)
          }
          error={form.errors.name}
        />
        <TextInput
          required
          placeholder="Tag line"
          value={form.values.tagLine}
          onChange={(event) =>
            form.setFieldValue("tagLine", event.currentTarget.value)
          }
          error={form.errors.tagLine}
        />
        <Textarea
          required
          placeholder="About your club"
          value={form.values.description}
          onChange={(event) =>
            form.setFieldValue("description", event.currentTarget.value)
          }
          error={form.errors.description}
          autosize
          minRows={3}
        />
        <Title order={6} mt={6}>
          Links
        </Title>
        <TextInput
          placeholder="Website link"
          value={form.values.websiteURL ?? ""}
          onChange={(event) =>
            form.setFieldValue("websiteURL", event.currentTarget.value)
          }
          error={form.errors.websiteURL}
        />
        <Group gap={4}>
          <Text c={"dimmed"} size={"sm"}>
            instagram.com/
          </Text>
          <TextInput
            placeholder="tag"
            value={form.values.instagramHandle ?? ""}
            onChange={(event) =>
              form.setFieldValue("instagramHandle", event.currentTarget.value)
            }
            error={form.errors.instagramHandle}
          />
        </Group>
        <TextInput
          placeholder="Event calendar link (e.g., Luma)"
          value={form.values.eventCalendarURL ?? ""}
          onChange={(event) =>
            form.setFieldValue("eventCalendarURL", event.currentTarget.value)
          }
          error={form.errors.eventCalendarURL}
        />
        <Title order={6} mt={6}>
          Share link
        </Title>
        <Group gap={4}>
          <Text c={"dimmed"} size={"sm"}>
            buildirl.com/share/
          </Text>
          <TextInput
            required
            placeholder="club-tag"
            value={form.values.publicId}
            onChange={(event) =>
              form.setFieldValue("publicId", event.currentTarget.value)
            }
            error={form.errors.publicId}
          />
        </Group>
        <Button
          type="submit"
          w={100}
          mt={"sm"}
          style={{ alignSelf: "center" }}
          disabled={!form.isValid() || createUser.isPending}
        >
          Save
        </Button>
      </Stack>
    </form>
  );
}
