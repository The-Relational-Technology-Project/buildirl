import { Button, ButtonProps } from "@mantine/core";
import { useMantineColorScheme, useMantineTheme } from "@mantine/core";
import React from "react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useMounted } from "@mantine/hooks";

type PrimaryButtonProps = {
  onClick: () => void;
  children: React.ReactNode;
};

export default function PrimaryButton({
  children,
  onClick,
  ...props
}: PrimaryButtonProps & ButtonProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const mounted = useMounted();

  return (
    mounted && (
      <Button
        variant={"filled"}
        onClick={onClick}
        rightSection={<IconArrowUpRight />}
        size={"xl"}
        style={{
          border: `1px solid ${colorScheme === "dark" ? theme.colors.dark[1] : "black"}`,
          borderRadius: 360,
          boxShadow: `4px 4px 0px ${colorScheme === "dark" ? theme.colors.dark[1] : "black"}`
        }}
        color={"#7A63CB"}
        {...props}
      >
        {children}
      </Button>
    )
  );
}
