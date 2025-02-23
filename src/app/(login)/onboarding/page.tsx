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
import { FirstNameSchema, LastNameSchema } from "~/server/service/types";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import AbsoluteCenter from "~/client/components/AbsoluteCenter";
import WithDefaultColorSchemeOnManualRouteChange from "~/client/components/WithDefaultColorSchemeOnManualRouteChange";

function CreateUserForm(props: StackProps) {
  const router = useRouter();
  const createUser = api.main.createUser.useMutation({
    onSuccess: () => {
      // allow middleware to redirect user to original page
      router.refresh();
    }
  });

  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: ""
    },

    validate: {
      firstName: (v) => safeValidateSchema(FirstNameSchema, v),
      lastName: (v) => safeValidateSchema(LastNameSchema, v)
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
          value={form.values.firstName}
          onChange={(event) =>
            form.setFieldValue("firstName", event.currentTarget.value)
          }
          error={form.errors.email && "Invalid name"}
        />
        <TextInput
          required
          placeholder="Last name"
          value={form.values.lastName}
          onChange={(event) =>
            form.setFieldValue("lastName", event.currentTarget.value)
          }
          error={form.errors.email && "Invalid name"}
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
