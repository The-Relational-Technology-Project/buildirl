import { Group, useMantineColorScheme, useMantineTheme } from "@mantine/core";

type InfoChipProps = {
  children: React.ReactNode;
  backgroundColor?: string;
};

export default function InfoChip({ children, backgroundColor }: InfoChipProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const chipBackground =
    backgroundColor ??
    (isDark ? theme.other.dark.surface : theme.colors.beige![1]);
  const chipBorder = isDark
    ? "2px solid rgba(255, 255, 255, 0.5)"
    : "2px solid #000";
  const chipTextColor = isDark ? theme.other.dark.text : "black";

  return (
    <Group
      bg={chipBackground}
      bd={chipBorder}
      c={chipTextColor}
      px={24}
      py={6}
      bdrs={999}
      ff={"text"}
      gap={8}
    >
      {children}
    </Group>
  );
}
