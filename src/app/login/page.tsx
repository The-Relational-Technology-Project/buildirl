"use client";

import { Center, PaperProps } from "@mantine/core";
import { AuthenticationForm } from "~/client/components/AuthenticationForm";

export default function Login(props: PaperProps) {
  return (
      <Center h="80vh">
        <AuthenticationForm />
      </Center>
  );
}
