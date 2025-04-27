import React from "react";
import { IconShare } from "@tabler/icons-react";
import { Button, ButtonProps } from "@mantine/core";

type ShareButtonProps = {
  clubPublicId: string;
  clubName: string;
};

export default function ShareButton({
  clubPublicId,
  clubName,
  ...props
}: ShareButtonProps & ButtonProps) {
  const onShare = () => {
    const shareUrl = `${window.location.origin}/join/${clubPublicId}/`;
    if (navigator.share) {
      void navigator.share({
        title: `Join me at ${clubName}!`,
        url: shareUrl
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert("Link copied to clipboard!");
      });
    }
  };

  return (
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