import {
  ActionIcon,
  ActionIconProps,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import React from "react";

type ColorSchemeAwareActionIconProps = {
  onClick: () => void;
  children: React.ReactNode;
};

export function ColorSchemeAwareActionIcon({
  onClick,
  children,
  ...props
}: ColorSchemeAwareActionIconProps & ActionIconProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  return (
    <ActionIcon
      onClick={onClick}
      {...props}
      c={colorScheme === "dark" ? theme.colors.dark[1] : "black"}
    >
      {children}
    </ActionIcon>
  );
}
