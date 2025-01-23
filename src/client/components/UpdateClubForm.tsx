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
  Stack,
  Text,
  Textarea,
  TextInput,
  Title
} from "@mantine/core";
import React from "react";

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
            websiteURL: websiteURL,
            instagramHandle: instagramHandle,
            eventCalendarURL: eventCalendarURL
          });
        }
      )}
    >
      <Stack>
        <Title>Create club</Title>
        <TextInput
          required
          placeholder="Club name"
          value={form.values.name}
          onChange={(event) =>
            form.setFieldValue("name", event.currentTarget.value)
          }
          error={form.errors.name}
          size={"xl"}
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
        <Title order={4}>Links</Title>
        <TextInput
          placeholder="Website link (optional)"
          value={form.values.websiteURL ?? undefined}
          onChange={(event) =>
            form.setFieldValue("websiteURL", event.currentTarget.value)
          }
          error={form.errors.websiteURL}
        />
        <Group gap={4}>
          <Text c={"dimmed"}>instagram.com/</Text>
          <TextInput
            placeholder="tag (optional)"
            value={form.values.instagramHandle ?? undefined}
            onChange={(event) =>
              form.setFieldValue("instagramHandle", event.currentTarget.value)
            }
            error={form.errors.instagramHandle}
          />
        </Group>
        <TextInput
          placeholder="Calendar link (optional)"
          value={form.values.eventCalendarURL ?? undefined}
          onChange={(event) =>
            form.setFieldValue("eventCalendarURL", event.currentTarget.value)
          }
          error={form.errors.eventCalendarURL}
        />
        <Title order={4}>Choose a share link</Title>
        <Group gap={4}>
          <Text c={"dimmed"}>buildirl.com/share/</Text>
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
          Create
        </Button>
      </Stack>
    </form>
  );
}
