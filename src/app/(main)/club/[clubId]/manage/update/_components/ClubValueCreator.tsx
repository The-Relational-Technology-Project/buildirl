import {
  ActionIcon,
  Box,
  Button,
  Grid,
  Group,
  Stack,
  Text,
  TextInput,
  Textarea,
  useMatches
} from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { ClubValues } from "~/server/club/types";
import { IconPicker } from "mantine-icon-picker";
import "mantine-icon-picker/style.css";
import "@tabler/icons-webfont/dist/tabler-icons.min.css";
import { ClubValueCard } from "~/app/(main)/(join)/join/[publicId]/_components/ClubValueCard";

export function ClubValueCreator({
  clubValues,
  onChange
}: {
  clubValues: ClubValues;
  onChange: (values: ClubValues) => void;
}) {
  const [newValue, setNewValue] = useState<{
    icon: string;
    title: string;
    description: string;
  }>({
    icon: "",
    title: "",
    description: ""
  });
  const [isAdding, setIsAdding] = useState(false);

  const values = clubValues.items || [];
  const cardHeight = useMatches({ base: 200, md: 200 });
  const cardWidth = useMatches({ base: 155, md: 160 });
  const gridCols = useMatches({ base: 6, md: 3 });

  const handleAdd = () => {
    if (newValue.icon && newValue.title.trim() && newValue.description.trim()) {
      onChange({
        items: [
          ...values,
          {
            icon: newValue.icon,
            title: newValue.title.trim(),
            description: newValue.description.trim()
          }
        ]
      });
      setNewValue({ icon: "", title: "", description: "" });
      setIsAdding(false);
    }
  };

  const handleRemove = (index: number) => {
    onChange({
      items: values.filter((_, i) => i !== index)
    });
    setNewValue({ icon: "", title: "", description: "" });
  };

  return (
    <Stack gap={16}>
      <Text size={"xs"} color="dimmed" pb={0}>
        {
          "Add up to six core values that represent your club's mission and culture."
        }
      </Text>
      <Grid gutter={{ base: 12, sm: 16 }}>
        {values.map((value, index) => (
          <Grid.Col span={gridCols} key={`${value.title}-${index}`}>
            <Box
              style={{
                position: "relative",
                width: cardWidth,
                margin: "0 auto"
              }}
            >
              <ActionIcon
                variant="light"
                color="red"
                onClick={() => handleRemove(index)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  zIndex: 1
                }}
              >
                <IconX size={16} />
              </ActionIcon>
              <ClubValueCard value={value} height={cardHeight} />
            </Box>
          </Grid.Col>
        ))}
        {values.length < 6 && (
          <Grid.Col span={gridCols} key="add-card">
            <Stack
              w={cardWidth}
              h={cardHeight}
              align="center"
              justify="center"
              gap={8}
              onClick={() => {
                if (isAdding) {
                  setIsAdding(false);
                  setNewValue({ icon: "", title: "", description: "" });
                  return;
                }
                setIsAdding(true);
                setNewValue({ icon: "", title: "", description: "" });
              }}
              style={{
                margin: "0 auto",
                border: "1px dashed #a6a6a6ff",
                boxShadow: "2px 2px 0px",
                cursor: "pointer",
                backgroundColor: "white",
                opacity: isAdding ? 0.6 : 1
              }}
            >
              <IconPlus size={28} color={"#7240d2"} />
              <Text size="sm" c="dimmed">
                Add value
              </Text>
            </Stack>
          </Grid.Col>
        )}
      </Grid>
      {isAdding && (
        <Stack align="flex-start" gap={4} style={{ width: "100%", padding: 0 }}>
          <Group
            align="flex-start"
            gap={16}
            style={{
              width: "100%",
              padding: 10,
              border: "1px dashed #a6a6a6ff",
              borderRadius: 4,
              marginTop: 8
            }}
          >
            <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
              <Group gap={8}>
                <Text size="xs" style={{ whiteSpace: "nowrap" }}>
                  {"*Choose an icon:"}
                </Text>
                <IconPicker
                  key={newValue.icon || "empty"}
                  value={newValue.icon}
                  onSelect={(icon: string | undefined) =>
                    icon && setNewValue((v) => ({ ...v, icon }))
                  }
                  iconSize={24}
                  searchPlaceholder="Pick icon"
                  color="#7240d2"
                />
              </Group>
              <TextInput
                placeholder="Value title"
                value={newValue.title}
                onChange={(e) =>
                  setNewValue((v) => ({
                    ...v,
                    title: e.target.value.slice(0, 15)
                  }))
                }
                maxLength={15}
                style={{ width: "100%" }}
                rightSection={
                  <Text
                    size="xs"
                    c={newValue.title.length >= 15 ? "red" : "dimmed"}
                    style={{
                      width: 32,
                      textAlign: "right",
                      paddingRight: 4
                    }}
                  >
                    {newValue.title.length}/15
                  </Text>
                }
              />
              <Textarea
                placeholder="Value description"
                value={newValue.description}
                onChange={(e) =>
                  setNewValue((v) => ({
                    ...v,
                    description: e.target.value.slice(0, 80)
                  }))
                }
                minRows={2}
                maxRows={2}
                autosize
                maxLength={80}
                style={{
                  width: "100%",
                  marginTop: 4,
                  textAlign: "start"
                }}
                rightSection={
                  <Text
                    size="xs"
                    c={newValue.description.length >= 80 ? "red" : "dimmed"}
                    style={{
                      width: 75,
                      textAlign: "left",
                      paddingRight: 4,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere"
                    }}
                  >
                    {newValue.description.length}/ 80
                  </Text>
                }
              />

              <Stack align="center" style={{ width: "100%" }} gap={8} mt="sm">
                {(!newValue.icon ||
                  !newValue.title.trim() ||
                  !newValue.description.trim()) && (
                  <Text size="xs" c="red">
                    All fields must be filled to add a value.
                  </Text>
                )}
                <Button
                  type="button"
                  size="xs"
                  onClick={handleAdd}
                  disabled={
                    !newValue.icon ||
                    !newValue.title.trim() ||
                    !newValue.description.trim()
                  }
                  style={{ alignSelf: "center", width: "50%" }}
                >
                  Add Value
                </Button>
              </Stack>
            </Stack>
          </Group>
        </Stack>
      )}
    </Stack>
  );
}
