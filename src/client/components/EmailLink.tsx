import { Anchor, ThemeIcon } from "@mantine/core";
import React from "react";
import { IconMail } from "@tabler/icons-react";

type EmailLinkProp = {
  email: string;
};

export function EmailLink({ email }: EmailLinkProp) {
  return (
    <Anchor href={`mailto:${email}`}>
      <ThemeIcon variant={"transparent"} color={"black"}>
        <IconMail size={16} />
      </ThemeIcon>
    </Anchor>
  );
}
