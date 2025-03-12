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
import AbsoluteCenter from "~/client/components/AbsoluteCenter";

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
          websiteUrl: null,
          instagramHandle: null,
          eventCalendarUrl: null
        });
      })}
    >
      <Stack {...props}>
        <TextInput
          required
          placeholder="Club name"
          key={form.key("name")}
          {...form.getInputProps("name")}
        />
        <Title order={6} mt={4}>
          Choose a share link.
        </Title>
        <Group gap={4} wrap={"nowrap"}>
          <Text size={"sm"}>clubs.buildirl.com/join/</Text>
          <TextInput
            required
            placeholder="club-tag"
            key={form.key("publicId")}
            {...form.getInputProps("publicId")}
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
      <Paper p="xl" w={{ base: 300, md: 400 }}>
        <Title order={4}>Create a club</Title>
        <CreateClubForm mt={"md"} />
      </Paper>
    </AbsoluteCenter>
  );
}
