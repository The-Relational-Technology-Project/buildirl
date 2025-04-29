"use client";

import { api } from "~/trpc/react";
import {
  Stack,
  TextInput,
  Text,
  Group,
  Title,
  Paper,
  StackProps,
  Box
} from "@mantine/core";
import { ClubNameSchema, ClubPublicIdSchema } from "~/server/service/types";
import { useForm } from "@mantine/form";
import React from "react";
import { safeValidateSchema } from "~/utils/zod";
import { useRouter } from "next/navigation";
import AbsoluteCenter from "~/client/components/AbsoluteCenter";
import PrimaryButton from "~/client/components/PrimaryButton";

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
          Claim your club link.
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
        <Box style={{ alignSelf: "center" }}>
          <PrimaryButton
            type="submit"
            w={150}
            size={"md"}
            disabled={!form.isValid()}
            loading={createUser.isPending}
          >
            Create
          </PrimaryButton>
        </Box>
      </Stack>
    </form>
  );
}

export default function CreateClub() {
  return (
    <AbsoluteCenter adjustForHeader>
      <Paper p="xl" w={{ base: 300, md: 400 }}>
        <Title order={4}>Build a club</Title>
        <CreateClubForm mt={"md"} />
      </Paper>
    </AbsoluteCenter>
  );
}
