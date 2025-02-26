import {
  Button,
  Divider,
  Group,
  Paper,
  Stack,
  TextInput,
  Image,
  Anchor
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useToggle } from "@mantine/hooks";
import { z } from "zod";
import { useState } from "react";
import { createComponentClient } from "~/utils/supabase/auth/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "~/client/logger";
import { safeValidateSchema } from "~/utils/zod";

const EmailSchema = z
  .string()
  .min(1, "Required")
  .email("Invalid email address");

const OtpSchema = z.string().regex(/^\d{6}$/, "Code must be 6 digits");

type EmailFormProps = {
  toggle: () => void;
  setEmail: (email: string) => void;
  supabase: SupabaseClient;
};

function EmailForm({ toggle, setEmail, supabase }: EmailFormProps) {
  const form = useForm({
    initialValues: {
      email: ""
    },

    validate: {
      email: (v) => safeValidateSchema(EmailSchema, v)
    }
  });

  const handleSubmit = async (values: { email: string }) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email
      });

      if (error) throw error;

      setEmail(values.email);
      toggle();
    } catch (e) {
      logger.error(e, "failed to send OTP");
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          required
          label="Email"
          placeholder="hello@buildirl.com"
          value={form.values.email}
          onChange={(event) =>
            form.setFieldValue("email", event.currentTarget.value)
          }
          error={form.errors.email && "Invalid email"}
        />
        <Button type="submit" mt="sm">
          {"Send code"}
        </Button>
        <Anchor
          c={"dimmed"}
          component="button"
          type="button"
          onClick={toggle}
          size="xs"
        >
          Received code?
        </Anchor>
      </Stack>
    </form>
  );
}

type OtpProps = {
  toggle: () => void;
  email: string;
  supabase: SupabaseClient;
};

function OtpForm({ toggle, email, supabase }: OtpProps) {
  const form = useForm({
    initialValues: {
      code: ""
    },

    validate: {
      code: (v) => safeValidateSchema(OtpSchema, v)
    }
  });

  const handleSubmit = async (values: { code: string }) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: values.code,
        type: "magiclink"
      });

      if (error) throw error;
    } catch (e) {
      logger.error(e, `failed to verify OTP`);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          type="number"
          required
          label="Enter code"
          placeholder="6-digit code from email"
          value={form.values.code}
          onChange={(event) =>
            form.setFieldValue("code", event.currentTarget.value)
          }
          error={form.errors.code && "Invalid code"}
        />
        <Button type="submit" mt="sm">
          {"Login"}
        </Button>
        <Anchor
          c={"dimmed"}
          component="button"
          type="button"
          onClick={toggle}
          size="xs"
        >
          Try again
        </Anchor>
      </Stack>
    </form>
  );
}

export default function AuthenticationForm() {
  const [type, toggle] = useToggle(["login", "otp"]);
  const [email, setEmail] = useState("");
  const supabase = createComponentClient();

  return (
    <Paper p="xl" w={300}>
      <Group justify="center">
        <Image src={"/images/logo.svg"} h={40} />
      </Group>

      <Divider
        label={"Sign up or sign in below"}
        labelPosition="center"
        my="lg"
      />

      {type === "login" && (
        <EmailForm toggle={toggle} setEmail={setEmail} supabase={supabase} />
      )}

      {type === "otp" && (
        <OtpForm toggle={toggle} email={email} supabase={supabase} />
      )}
    </Paper>
  );
}
