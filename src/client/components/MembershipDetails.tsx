import React from "react";
import { Box, Group, Stack, Text, Title, useMantineTheme, useMantineColorScheme } from "@mantine/core";
import { IconMail, IconCalendar, IconCoin } from "@tabler/icons-react";
import { Membership } from "~/server/service/types";
import { toDisplayDate } from "~/client/utils";

type MembershipDetailsProps = {
  membership: Membership;
  isPending: boolean;
  title?: string;
};

export default function MembershipDetails({
  membership,
  isPending,
  title = "Member Information"
}: MembershipDetailsProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  
  const iconColor = colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[6];

  return (
    <Stack gap="md">
      <Title order={4} fw={500}>{title}</Title>
      
      <Stack gap="sm">
        <Group gap="xs">
          <IconCoin size={18} color={iconColor} />
          <Text size="sm" fw={500}>Tier:</Text>
          <Text size="sm">{membership.membershipTier.name}</Text>
        </Group>
        
        <Group gap="xs">
          <IconCoin size={18} color={iconColor} />
          <Text size="sm" fw={500}>Contribution:</Text>
          <Text size="sm">${membership.membershipTier.costPerMonthInUSD}.00/month</Text>
        </Group>
        
        <Group gap="xs">
          <IconCalendar size={18} color={iconColor} />
          <Text size="sm" fw={500}>{isPending ? "Applied:" : "Joined:"}</Text>
          <Text size="sm">{toDisplayDate(membership.createdAt)}</Text>
        </Group>
        
        {membership.email && (
          <Group gap="xs">
            <IconMail size={18} color={iconColor} />
            <Text size="sm" fw={500}>Email:</Text>
            <Box 
              component="a" 
              href={`mailto:${membership.email}`} 
              style={{ color: "inherit", cursor: "pointer", textDecoration: "none" }}
            >
              <Text size="sm" style={{ wordBreak: "break-all" }}>
                {membership.email}
              </Text>
            </Box>
          </Group>
        )}
      </Stack>
    </Stack>
  );
} 