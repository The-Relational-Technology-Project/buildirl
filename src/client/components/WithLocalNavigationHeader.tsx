import { Box, Stack } from "@mantine/core";
import { HEADER_BAR_HEIGHT } from "~/client/components/HeaderBar";
import { IconArrowLeft } from "@tabler/icons-react";
import React from "react";
import { useRouter } from "next/navigation";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";

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
        <ColorSchemeAwareActionIcon
          onClick={() => router.back()}
          variant="transparent"
          mt={"lg"}
        >
          <IconArrowLeft />
        </ColorSchemeAwareActionIcon>
      </Box>

      <Box mt={`calc(${HEADER_BAR_HEIGHT}px + 20px)`}>{children}</Box>
    </Stack>
  );
}
