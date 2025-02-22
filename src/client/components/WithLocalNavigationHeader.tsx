import {
  Box,
  BoxProps,
  Stack,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { HEADER_BAR_HEIGHT } from "~/client/components/HeaderBar";
import React from "react";
import { useRouter } from "next/navigation";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";
import { IconChevronLeft } from "@tabler/icons-react";
import { useMounted } from "@mantine/hooks";

type NavigationButtonProps = {
  onClick: () => void;
  icon: React.ReactNode;
};

export function NavigationButton({
  onClick,
  icon,
  ...props
}: NavigationButtonProps & BoxProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  return (
    <Box
      bg={colorScheme === "dark" ? theme.colors.dark[7] : "white"}
      w={30}
      h={30}
      style={{
        border: "1px solid",
        boxShadow: "2px 2px 0px"
      }}
      {...props}
    >
      <ColorSchemeAwareActionIcon onClick={onClick} variant="transparent">
        {icon}
      </ColorSchemeAwareActionIcon>
    </Box>
  );
}

type WithLocalNavigationHeaderProps = {
  title?: string;
  children: React.ReactNode;
  hidden?: boolean;
};

export default function WithLocalNavigationHeader({
  children,
  hidden = false
}: WithLocalNavigationHeaderProps) {
  const router = useRouter();
  if (hidden) {
    return <Box mt={40}>{children}</Box>;
  }

  return (
    <Stack>
      <Box
        pos="fixed"
        top={`calc(${HEADER_BAR_HEIGHT}px + 1px)`}
        pb={4}
        style={{ zIndex: 100, background: "transparent" }}
      >
        <NavigationButton
          onClick={() => router.back()}
          icon={<IconChevronLeft />}
          mt={"lg"}
        />
      </Box>

      <Box mt={`calc(${HEADER_BAR_HEIGHT}px + 20px)`}>{children}</Box>
    </Stack>
  );
}
