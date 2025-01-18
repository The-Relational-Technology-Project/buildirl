import {
  Button,
  Divider,
  Group,
  Paper,
  PaperProps,
  Stack,
  TextInput,
  Image,
  Anchor
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useToggle } from "@mantine/hooks";
import { z } from "zod";

const EmailSchema = z
  .string()
  .min(1, "Required")
  .email("Invalid email address");

const OtpSchema = z.string().regex(/^\d{6}$/, "Code must be6 digits");

const validateSchema = <T extends z.ZodType>(
  schema: T,
  value: unknown
): string | null => {
  const result = schema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0]?.message ?? "Invalid input";
  }
  return null;
};

type EmailFormProps = {
  toggle: () => void;
};

function EmailForm({ toggle }: EmailFormProps) {
  const form = useForm({
    initialValues: {
      email: ""
    },

    validate: {
      email: (val) => validateSchema(EmailSchema, val)
    }
  });

  return (
    <form
      onSubmit={form.onSubmit(() => {
        toggle();
      })}
    >
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
          radius="md"
        />
        <Button type="submit" radius="xl" mt="sm">
          {"Send code"}
        </Button>
      </Stack>
    </form>
  );
}

type OtpProps = {
  toggle: () => void;
};

function OtpForm({ toggle }: EmailFormProps) {
  const form = useForm({
    initialValues: {
      code: ""
    },

    validate: {
      code: (val) => validateSchema(OtpSchema, val)
    }
  });

  return (
    <form
      onSubmit={form.onSubmit(() => {
        toggle();
      })}
    >
      <Stack>
        <TextInput
          type={"number"}
          required
          label="Enter code"
          placeholder="6-digit code from email"
          value={form.values.code}
          onChange={(event) =>
            form.setFieldValue("code", event.currentTarget.value)
          }
          error={form.errors.code && "Invalid code"}
          radius="md"
        />
        <Button type="submit" radius="xl" mt="sm">
          {"Login"}
        </Button>
        <Anchor
          component="button"
          type="button"
          c="dimmed"
          onClick={toggle}
          size="xs"
        >
          Try again
        </Anchor>
      </Stack>
    </form>
  );
}

export function AuthenticationForm(props: PaperProps) {
  const [type, toggle] = useToggle(["login", "otp"]);
  return (
    <Paper radius="md" p="xl" withBorder {...props} w={300}>
      <Group justify="center">
        <Image src={"/logo.svg"} h={40} />
      </Group>

      <Divider
        label={"Sign up or sign in below"}
        labelPosition="center"
        my="lg"
      />

      {type === "login" && <EmailForm toggle={toggle} />}

      {type === "otp" && <OtpForm toggle={toggle} />}
    </Paper>
  );
}
