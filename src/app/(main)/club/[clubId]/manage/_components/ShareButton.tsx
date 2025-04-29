import React from "react";
import { IconCheck, IconShare } from "@tabler/icons-react";
import { Button, ButtonProps, useMatches } from "@mantine/core";
import { logger, notifyError } from "~/client/logger";
import { notifications } from "@mantine/notifications";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";

type ShareButtonProps = {
  clubPublicId: string;
};

export default function ShareButton({
  clubPublicId,
  ...props
}: ShareButtonProps & ButtonProps) {
  const isMobile = useMatches({ base: true, md: false });

  const onShare = async () => {
    const url = `${window.location.origin}/join/${clubPublicId}`;

    try {
      await navigator.clipboard.writeText(url);
      notifications.show({
        title: "Link copied",
        message: "Share link has been copied to clipboard",
        color: "green",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 3000
      });
    } catch (e) {
      logger.error(e, "failed to copy to clipboard");
      notifyError("Failed to copy share link to clipboard.");
    }
  };

  return isMobile ? (
    <ColorSchemeAwareActionIcon
      onClick={onShare}
      style={{ border: "1px solid" }}
      mr={-10}
    >
      <IconShare size={16} />
    </ColorSchemeAwareActionIcon>
  ) : (
    <Button
      leftSection={<IconShare size={16} />}
      variant="outline"
      onClick={onShare}
      {...props}
    >
      Share
    </Button>
  );
}
