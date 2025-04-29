import React from "react";
import { IconShare } from "@tabler/icons-react";
import { Button, ButtonProps, useMatches } from "@mantine/core";
import { logger, notifyError } from "~/client/logger";
import { showNotification } from "@mantine/notifications";
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
      showNotification({
        title: "Link copied",
        message: "Share link has been copied to clipboard",
        color: "green",
        autoClose: 3000
      });
    } catch (e) {
      logger.error(e, "failed to copy to clipboard");
      notifyError(`${e}`);
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
