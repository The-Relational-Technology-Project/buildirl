import {
  ThemeIcon,
  ThemeIconProps,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import React from "react";

export function ColorSchemeAwareThemeIcon({
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
      c={colorScheme === "dark" ? theme.colors.dark[1] : "black"}
    >
      {children}
    </ThemeIcon>
  );
}
