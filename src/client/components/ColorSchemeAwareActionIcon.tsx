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
      color={colorScheme === "dark" ? theme.colors.dark[7] : "black"}
    >
      {children}
    </ActionIcon>
  );
}

type ActionIconBoxProps = {
  onClick: () => void;
  icon: React.ReactNode;
};

export function ActionIconBox({
  onClick,
  icon,
  ...props
}: ActionIconBoxProps & ActionIconProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  return (
    <ColorSchemeAwareActionIcon
      onClick={onClick}
      style={{
        border: `1px solid`,
        borderRadius: 5,
        backgroundColor:
          colorScheme === "dark" ? theme.colors.beige![1] : "white"
      }}
      {...props}
    >
      {icon}
    </ColorSchemeAwareActionIcon>
  );
}
