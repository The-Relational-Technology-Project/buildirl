import {
  ActionIcon,
  ActionIconProps,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import React from "react";
import { IconLink } from "@tabler/icons-react";

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
      c={colorScheme === "dark" ? theme.colors.dark[1] : "black"}
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
  return (
    <ColorSchemeAwareActionIcon
      onClick={onClick}
      style={{
        border: `2px solid`,
        borderRadius: 0
      }}
      {...props}
    >
      {icon}
    </ColorSchemeAwareActionIcon>
  );
}
