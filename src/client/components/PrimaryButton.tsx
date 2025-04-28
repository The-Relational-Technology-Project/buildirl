import { Button, ButtonProps } from "@mantine/core";
import { useMantineColorScheme, useMantineTheme } from "@mantine/core";
import React from "react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useMounted } from "@mantine/hooks";

type PrimaryButtonProps = {
  children: React.ReactNode;
  includeIcon?: boolean;
  color?: string;
  onClick?: (e: React.MouseEvent) => void;
  type?: "submit" | "reset" | "button";
};

export default function PrimaryButton({
  children,
  color = "lilac",
  // default no-op
  onClick = () => {},
  includeIcon = false,
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
        rightSection={includeIcon && <IconArrowUpRight />}
        size={"xl"}
        w={{ base: 300, md: 400 }}
        style={{
          border: `1px solid ${colorScheme === "dark" ? theme.colors.dark[1] : "black"}`,
          borderRadius: 360,
          boxShadow: `2px 2px 0px ${colorScheme === "dark" ? theme.colors.dark[1] : "black"}`
        }}
        color={color}
        {...props}
      >
        {children}
      </Button>
    )
  );
}
