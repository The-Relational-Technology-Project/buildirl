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

export default function ColorSchemeAwareActionIcon({
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
      color={colorScheme === "dark" ? theme.other.dark.text : "black"}
    >
      {children}
    </ActionIcon>
  );
}

type ActionIconBoxProps = {
  onClick: () => void;
  icon: React.ReactNode;
  variant?: "default" | "infochip";
};

export function ActionIconBox({
  onClick,
  icon,
  variant = "default",
  ...props
}: ActionIconBoxProps & ActionIconProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const baseStyle =
    variant === "infochip"
      ? isDark
        ? {
            border: "1px solid rgba(255, 255, 255, 0.5)",
            borderRadius: 4,
            backgroundColor: theme.other.dark.surface,
            color: theme.other.dark.text
          }
        : {
            border: "1px solid #000",
            borderRadius: 4,
            backgroundColor: theme.colors.beige![1],
            color: "black"
          }
      : {
          border: "1px solid",
          borderRadius: 5,
          backgroundColor: isDark ? theme.colors.beige![1] : "white"
        };

  return (
    <ColorSchemeAwareActionIcon
      onClick={onClick}
      style={{
        ...baseStyle,
        padding: 1
      }}
      {...props}
    >
      {icon}
    </ColorSchemeAwareActionIcon>
  );
}
