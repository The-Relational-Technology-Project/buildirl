import { Group } from "@mantine/core";

type InfoChipProps = {
  children: React.ReactNode;
};

export default function InfoChip({ children }: InfoChipProps) {
  return (
    <Group
      bg={"#7241d2"}
      c={"white"}
      px={24}
      py={8}
      bdrs={999}
      ff={"text"}
      gap={8}
    >
      {children}
    </Group>
  );
}
