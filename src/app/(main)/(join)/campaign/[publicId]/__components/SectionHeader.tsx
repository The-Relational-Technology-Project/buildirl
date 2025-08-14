// !! PROTOTYPE

"use client";

import { Group, Title, Badge, ThemeIcon } from "@mantine/core";
import { TablerIcon } from "@tabler/icons-react";

interface SectionHeaderProps {
  title: string;
  icon: TablerIcon;
  badge?: string;
  badgeColor?: string;
  iconColor?: string;
}

export default function SectionHeader({
  title,
  icon: Icon,
  badge,
  badgeColor = "lilac",
  iconColor = "lilac"
}: SectionHeaderProps) {
  return (
    <Group gap="md" mb="lg" align="flex-start">
      <ThemeIcon>
        <Icon size={24} color={iconColor === "lilac" ? "#7A3EDA" : "#FFC857"} />
      </ThemeIcon>
      <div>
        <Title order={2} fz={{ base: 18, md: 20 }} mb="xs">
          {title}
        </Title>
        {badge && (
          <Badge color={badgeColor} variant="light" size={"sm"}>
            {badge}
          </Badge>
        )}
      </div>
    </Group>
  );
}
