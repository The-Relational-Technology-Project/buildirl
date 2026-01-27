import React from "react";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";
import { IconShare } from "@tabler/icons-react";
import {
  Group,
  useMantineColorScheme,
  useMantineTheme,
  useMatches
} from "@mantine/core";

type ShareIconButtonProps = {
  clubPublicId: string;
  clubName: string;
};

export default function ShareIconButton({
  clubPublicId,
  clubName
}: ShareIconButtonProps) {
  const size = useMatches({ base: 32, md: 45 });
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const buttonBackground =
    isDark ? theme.other.dark.surface : theme.colors.beige![1];
  const buttonBorder = isDark
    ? "1px solid rgba(255, 255, 255, 0.5)"
    : "1px solid #000";
  const iconColor = isDark ? theme.other.dark.text : "black";

  const onShare = () => {
    const shareUrl = `${window.location.origin}/join/${clubPublicId}/`;
    if (navigator.share) {
      void navigator.share({
        title: `Join me at ${clubName}!`,
        url: shareUrl
      });
    } else {
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <Group
      bg={buttonBackground}
      w={size}
      h={size}
      p={2}
      bdrs={4}
      style={{
        border: buttonBorder
      }}
      align="center"
      justify="center"
    >
      <ColorSchemeAwareActionIcon
        onClick={onShare}
        size={"80%"}
        variant="transparent"
        style={{ color: iconColor }}
      >
        <IconShare size={"100%"} />
      </ColorSchemeAwareActionIcon>
    </Group>
  );
}
