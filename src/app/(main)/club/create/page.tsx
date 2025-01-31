"use client";

import { api } from "~/trpc/react";
import {
  Stack,
  Button,
  TextInput,
  Text,
  Group,
  Title,
  Paper,
  StackProps
} from "@mantine/core";
import { ClubNameSchema, ClubPublicIdSchema } from "~/server/service/types";
import { useForm } from "@mantine/form";
import React from "react";
import { safeValidateSchema } from "~/utils/zod";
import { useRouter } from "next/navigation";
import { AbsoluteCenter } from "~/client/components/AbsoluteCenter";

function CreateClubForm(props: StackProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const createUser = api.main.createClub.useMutation({
    onSuccess: async (r) => {
      await utils.main.userOwnedClubs.invalidate();
      router.push(`/club/${r.createdEntityId}/manage`);
    }
  });

  const form = useForm({
    initialValues: {
      name: "",
      publicId: ""
    },

    validateInputOnChange: true,

    validate: {
      name: (v) => safeValidateSchema(ClubNameSchema, v),
      publicId: (v) => safeValidateSchema(ClubPublicIdSchema, v)
    }
  });

  return (
    <form
      onSubmit={form.onSubmit(async ({ name, publicId }) => {
        await createUser.mutateAsync({
          name: name,
          publicId: publicId,
          // default empty
          tagLine: "",
          description: "",
          websiteURL: null,
          instagramHandle: null,
          eventCalendarURL: null
        });
      })}
    >
      <Stack {...props}>
        <TextInput
          required
          placeholder="Club name"
          value={form.values.name}
          onChange={(event) =>
            form.setFieldValue("name", event.currentTarget.value)
          }
          error={form.errors.name}
        />
        <Title order={6} mt={4}>
          Choose a share link.
        </Title>
        <Group gap={4}>
          <Text c={"dimmed"} size={"sm"}>
            buildirl.com/join/
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
          disabled={!form.isValid()}
          loading={createUser.isPending}
        >
          Create
        </Button>
      </Stack>
    </form>
  );
}

export default function CreateClub() {
  return (
    <AbsoluteCenter adjustForHeader>
      <Paper p="xl" withBorder w={300}>
        <Title order={4}>Create a club</Title>
        <CreateClubForm mt={"md"} />
      </Paper>
    </AbsoluteCenter>
  );
}
