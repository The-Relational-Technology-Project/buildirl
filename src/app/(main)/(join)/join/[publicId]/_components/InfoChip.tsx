import { Group } from "@mantine/core";

type InfoChipProps = {
  children: React.ReactNode;
  backgroundColor?: string;
};

export default function InfoChip({ children, backgroundColor }: InfoChipProps) {
  return (
    <Group
      bg={backgroundColor ?? "#000000"}
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
