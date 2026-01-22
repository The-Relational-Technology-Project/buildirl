import {
  ThemeIcon,
  ThemeIconProps,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import React from "react";

export default function ColorSchemeAwareThemeIcon({
  children,
  ...props
}: ThemeIconProps & {
  children: React.ReactNode;
}) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  return (
    <ThemeIcon
      {...props}
      color={colorScheme === "dark" ? theme.other.dark.textMuted : "black"}
    >
      {children}
    </ThemeIcon>
  );
}
