"use client";

import {
  Button,
  Paper,
  Stack,
  StackProps,
  Text,
  TextInput,
  Title
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import { RequiredStringSchema } from "~/server/membership/types";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import AbsoluteCenter from "~/client/components/AbsoluteCenter";
import WithDefaultColorSchemeOnManualRouteChange from "~/client/components/WithDefaultColorSchemeOnManualRouteChange";
import { handleDefaultMutationError } from "~/client/logger";

function CreateUserForm(props: StackProps) {
  const router = useRouter();
  const createUser = api.main.createUser.useMutation({
    onSuccess: () => {
      // allow middleware to redirect user to original page
      router.refresh();
    },
    onError: handleDefaultMutationError
  });

  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: ""
    },

    validateInputOnChange: true,

    validate: {
      firstName: (v) => safeValidateSchema(RequiredStringSchema, v),
      lastName: (v) => safeValidateSchema(RequiredStringSchema, v)
    }
  });

  return (
    <form
      onSubmit={form.onSubmit(async (v) => {
        await createUser.mutateAsync({
          firstName: v.firstName,
          lastName: v.lastName,
          // default empty
          description: ""
        });
      })}
    >
      <Stack {...props}>
        <TextInput
          required
          placeholder="First name"
          key={form.key("firstName")}
          {...form.getInputProps("firstName")}
        />
        <TextInput
          required
          placeholder="Last name"
          key={form.key("lastName")}
          {...form.getInputProps("lastName")}
        />
        <Button
          type="submit"
          mt="sm"
          style={{ alignSelf: "center" }}
          loading={createUser.isPending}
        >
          {"Finish"}
        </Button>
      </Stack>
    </form>
  );
}

export default function Onboarding() {
  return (
    <WithDefaultColorSchemeOnManualRouteChange>
      <AbsoluteCenter>
        <Paper p="xl" w={300}>
          <Title order={4}>Welcome</Title>
          <Text size={"md"} fw={300} mt={"xs"}>
            Tell us more about yourself.
          </Text>
          <CreateUserForm mt="md" />
        </Paper>
      </AbsoluteCenter>
    </WithDefaultColorSchemeOnManualRouteChange>
  );
}
