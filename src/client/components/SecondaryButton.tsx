import { Button, ButtonProps } from "@mantine/core";
import { useMantineColorScheme, useMantineTheme } from "@mantine/core";
import React from "react";
import { IconArrowUpRight } from "@tabler/icons-react";

type SecondaryButtonProps = {
  onClick: () => void;
  children: React.ReactNode;
  includeIcon?: boolean;
};

// color scheme aware outline button
export default function SecondaryButton({
  children,
  onClick,
  includeIcon = false,
  ...props
}: SecondaryButtonProps & ButtonProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  return (
    <Button
      variant={"outline"}
      onClick={onClick}
      rightSection={includeIcon && <IconArrowUpRight />}
      size={"xl"}
      style={{
        border: "2px solid",
        borderRadius: 360,
        boxShadow: "4px 4px 0px"
      }}
      color={colorScheme === "dark" ? theme.colors.dark[1] : "black"}
      {...props}
    >
      {children}
    </Button>
  );
}
