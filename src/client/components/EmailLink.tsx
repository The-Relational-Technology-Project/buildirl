import { Anchor } from "@mantine/core";
import React from "react";
import { IconMail } from "@tabler/icons-react";
import ColorSchemeAwareThemeIcon from "~/client/components/ColorSchemeAwareThemeIcon";

type EmailLinkProp = {
  email: string;
};

export default function EmailLink({ email }: EmailLinkProp) {
  return (
    <Anchor href={`mailto:${email}`}>
      <ColorSchemeAwareThemeIcon>
        <IconMail size={16} />
      </ColorSchemeAwareThemeIcon>
    </Anchor>
  );
}
