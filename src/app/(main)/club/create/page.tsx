"use client";

import { api } from "~/trpc/react";
import { Stack, TextInput, Title, Paper, StackProps, Box } from "@mantine/core";
import { ClubNameSchema, ClubPublicIdSchema } from "~/server/club/types";
import { useForm } from "@mantine/form";
import React from "react";
import { safeValidateSchema } from "~/utils/zod";
import { useRouter } from "next/navigation";
import AbsoluteCenter from "~/client/components/AbsoluteCenter";
import PrimaryButton from "~/client/components/PrimaryButton";
import { handleDefaultMutationError } from "~/client/logger";
import PrefixedInput from "~/client/components/PrefixedInput";
import LocationSelect from "~/client/components/LocationSelect";
import { CitySchema } from "~/server/club/types/location";

function CreateClubForm(props: StackProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const createUser = api.main.createClub.useMutation({
    onSuccess: async (r) => {
      await utils.main.userMemberships.invalidate();
      router.push(`/club/${r.createdEntityId}/manage`);
    },
    onError: handleDefaultMutationError
  });

  const form = useForm({
    initialValues: {
      name: "",
      publicId: "",
      location: ""
    },

    validateInputOnChange: true,

    validate: {
      name: (v) => safeValidateSchema(ClubNameSchema, v),
      publicId: (v) => safeValidateSchema(ClubPublicIdSchema, v),
      location: (v) => safeValidateSchema(CitySchema, v)
    }
  });

  return (
    <form
      onSubmit={form.onSubmit(async ({ name, publicId, location }) => {
        await createUser.mutateAsync({
          name: name,
          publicId: publicId,
          location: location
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
        <Stack gap={"xs"}>
          <Title order={6}>Location</Title>
          <LocationSelect
            value={form.values.location}
            onChange={(value) => {
              form.setFieldValue("location", value!);
              form.validateField("location");
            }}
            error={form.errors.location}
          />
        </Stack>
        <Stack gap={"xs"}>
          <Title order={6}>Claim your club link.</Title>
          <PrefixedInput
            prefix={"clubs.buildirl.com/join/"}
            required
            placeholder="club-tag"
            key={form.key("publicId")}
            {...form.getInputProps("publicId")}
          />
        </Stack>
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
