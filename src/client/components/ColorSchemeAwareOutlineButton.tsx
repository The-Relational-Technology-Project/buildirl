import { Button, ButtonProps } from "@mantine/core";
import { useMantineColorScheme, useMantineTheme } from "@mantine/core";
import React from "react";

type ColorSchemeAwareOutlineButtonProps = {
  onClick: () => void;
  children: React.ReactNode;
};

export default function ColorSchemeAwareOutlineButton({
  children,
  onClick,
  ...props
}: ColorSchemeAwareOutlineButtonProps & ButtonProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  return (
    <Button
      variant={"outline"}
      onClick={onClick}
      color={colorScheme === "dark" ? theme.colors.dark[1] : "black"}
      {...props}
    >
      {children}
    </Button>
  );
}
