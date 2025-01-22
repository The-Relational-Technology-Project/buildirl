"use client";

import { api } from "~/trpc/react";
import {
  Stack,
  Textarea,
  Button,
  TextInput,
  Text,
  Avatar,
  Group,
  Title
} from "@mantine/core";
import {
  ClubNameSchema,
  ClubPublicIdSchema,
  ClubTagLineSchema,
  InstagramHandle,
  InstagramHandleSchema,
  LongTextSchema,
  URLSchema,
  URL
} from "~/server/service/types";
import { useForm } from "@mantine/form";
import React from "react";
import { safeValidateSchema } from "~/utils/zod";
import { useRouter } from "next/navigation";
import { Maybe } from "~/utils/types";

function CreateClubForm() {
  const router = useRouter();
  const utils = api.useUtils();
  const createUser = api.main.createClub.useMutation({
    onSuccess: async () => {
      await utils.main.userOwnedClubs.invalidate();
      router.push("/create-club/membership-tiers");
    }
  });

  const form = useForm({
    initialValues: {
      publicId: "",
      name: "",
      tagLine: "",
      description: "",
      websiteURL: null as Maybe<URL>,
      instagramHandle: null as Maybe<InstagramHandle>,
      eventCalendarURL: null as Maybe<URL>
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
          await createUser.mutate({
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
      <Stack w={{ base: undefined, md: 400 }}>
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
              form.setFieldValue("clubPublicId", event.currentTarget.value)
            }
            error={form.errors.clubPublicId}
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

export default function CreateClub() {
  return (
    <Stack pt={"xl"} w={"100%"} align={"center"}>
      <CreateClubForm />
    </Stack>
  );
}
