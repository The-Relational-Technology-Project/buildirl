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
      style={{
        border: "2px solid",
        borderRadius: 360,
        boxShadow: "2px 2px 0px"
      }}
      color={colorScheme === "dark" ? theme.colors.dark[1] : "black"}
      {...props}
    >
      {children}
    </Button>
  );
}
