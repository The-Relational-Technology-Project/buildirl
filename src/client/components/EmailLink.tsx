import { Anchor, ThemeIcon } from "@mantine/core";
import React from "react";
import { IconMail } from "@tabler/icons-react";
import { ColorSchemeAwareThemeIcon } from "~/client/components/ColorSchemeAwareThemeIcon";

type EmailLinkProp = {
  email: string;
};

export function EmailLink({ email }: EmailLinkProp) {
  return (
    <Anchor href={`mailto:${email}`}>
      <ColorSchemeAwareThemeIcon variant={"transparent"}>
        <IconMail size={16} />
      </ColorSchemeAwareThemeIcon>
    </Anchor>
  );
}
