import {
  ActionIcon,
  Box,
  Stack,
  Title,
  useMantineColorScheme
} from "@mantine/core";
import { HEADER_BAR_HEIGHT } from "~/client/components/HeaderBar";
import { IconArrowLeft } from "@tabler/icons-react";
import React from "react";
import { useRouter } from "next/navigation";

type WithLocalNavigationHeaderProps = {
  title?: string;
  children: React.ReactNode;
  hidden?: boolean;
};

export function WithLocalNavigationHeader({
  children,
  hidden = false
}: WithLocalNavigationHeaderProps) {
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme();

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
        <ActionIcon
          onClick={() => router.back()}
          variant="transparent"
          color={colorScheme === "dark" ? "gray.5" : "black"}
          mt={"lg"}
        >
          <IconArrowLeft />
        </ActionIcon>
      </Box>

      <Box mt={`calc(${HEADER_BAR_HEIGHT}px + 20px)`}>{children}</Box>
    </Stack>
  );
}
