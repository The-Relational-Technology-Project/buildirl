import React from "react";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";
import { IconShare } from "@tabler/icons-react";
import { Group, useMatches } from "@mantine/core";
import { useMantineColorScheme, useMantineTheme } from "@mantine/core";

type ShareIconButtonProps = {
  clubPublicId: string;
  clubName: string;
};

export default function ShareIconButton({
  clubPublicId,
  clubName
}: ShareIconButtonProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const size = useMatches({ base: 32, md: 36 });

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
      bg={colorScheme === "dark" ? theme.colors.dark[7] : "white"}
      w={size}
      h={size}
      p={2}
      style={{
        border: "1px solid",
        boxShadow: "2px 2px 0px"
      }}
    >
      <ColorSchemeAwareActionIcon onClick={onShare} size={"100%"}>
        <IconShare size={"100%"} />
      </ColorSchemeAwareActionIcon>
    </Group>
  );
}
