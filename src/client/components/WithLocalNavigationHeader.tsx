import { ActionIcon, Box, Stack, Title } from "@mantine/core";
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
  title,
  hidden = false
}: WithLocalNavigationHeaderProps) {
  const router = useRouter();

  if (hidden) {
    return <Box mt={40}>{children}</Box>;
  }

  return (
    <Stack>
      <Stack
        pos="fixed"
        top={`calc(${HEADER_BAR_HEIGHT}px + 1px)`}
        pb={4}
        gap={"sm"}
        w="100%"
        bg="#fffcf8"
        style={{ zIndex: 100 }}
      >
        <ActionIcon
          onClick={() => router.back()}
          variant="transparent"
          color="white"
          mt={"lg"}
        >
          <IconArrowLeft color="black" />
        </ActionIcon>
        {title && <Title order={3}>{title}</Title>}
      </Stack>

      <Box
        mt={`calc(${HEADER_BAR_HEIGHT}px + ${title === undefined ? 20 : 70}px)`}
      >
        {children}
      </Box>
    </Stack>
  );
}
