import { Button, ButtonProps } from "@mantine/core";
import { useMantineColorScheme, useMantineTheme } from "@mantine/core";
import React from "react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useMounted } from "@mantine/hooks";

type PrimaryButtonProps = {
  children: React.ReactNode;
  hideIcon?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  type?: "submit" | "reset" | "button";
};

export default function PrimaryButton({
  children,
  // default no-op
  onClick = () => {},
  hideIcon = false,
  type,
  ...props
}: PrimaryButtonProps & ButtonProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const mounted = useMounted();

  return (
    mounted && (
      <Button
        type={type}
        variant={"filled"}
        onClick={onClick}
        rightSection={!hideIcon && <IconArrowUpRight />}
        size={"xl"}
        style={{
          border: `2px solid ${colorScheme === "dark" ? theme.colors.dark[1] : "black"}`,
          borderRadius: 360,
          boxShadow: `4px 4px 0px ${colorScheme === "dark" ? theme.colors.dark[1] : "black"}`
        }}
        color={"#7a63cb"}
        {...props}
      >
        {children}
      </Button>
    )
  );
}
