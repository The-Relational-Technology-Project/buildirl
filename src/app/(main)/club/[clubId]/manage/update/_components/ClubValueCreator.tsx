import {
  ActionIcon,
  Button,
  Group,
  Stack,
  Text,
  TextInput,
  Textarea
} from "@mantine/core";
import IconX from "@tabler/icons-react/dist/esm/icons/IconX";
import { useState } from "react";
import { ClubValues } from "~/server/club/types";
import { IconPicker } from "mantine-icon-picker";
import "mantine-icon-picker/style.css";
import "@tabler/icons-webfont/dist/tabler-icons.min.css";

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

  const values = clubValues.items || [];

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
    }
  };

  const handleRemove = (index: number) => {
    onChange({
      items: values.filter((_, i) => i !== index)
    });
    setNewValue({ icon: "", title: "", description: "" });
  };

  return (
    <Stack gap={4}>
      <Text size={"xs"} color="dimmed" pb={0}>
        {
          "Define the core values that represent your club's mission and culture."
        }
      </Text>
      <Stack gap={4}>
        {values.map((value, index) => (
          <Group
            key={index}
            align="center"
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #b1b1b1ff",
              borderRadius: 4
            }}
          >
            <Group
              flex={1}
              gap={8}
              align="flex-start"
              style={{ width: "100%" }}
            >
              <IconPicker value={value.icon} iconSize={24} color="black" />
              <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Text fw={500}>{value.title}</Text>
                <Text
                  size="sm"
                  color="dimmed"
                  lineClamp={2}
                  style={{ marginTop: 2, textAlign: "start" }}
                >
                  {value.description}
                </Text>
              </Stack>
            </Group>
            <ActionIcon color="red" onClick={() => handleRemove(index)}>
              <IconX size={16} />
            </ActionIcon>
          </Group>
        ))}
      </Stack>
      <Stack align="flex-start" gap={4} style={{ width: "100%", padding: 0 }}>
        <Group
          align="center"
          style={{
            width: "100%",
            padding: 10,
            border: "1px dashed #a6a6a6ff",
            borderRadius: 4,
            marginTop: 8
          }}
        >
          <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
            <Group gap={8} align="center">
              <Text size="xs" color="dimmed" style={{ whiteSpace: "nowrap" }}>
                {"Choose an icon: "}
              </Text>
              <IconPicker
                key={newValue.icon || "empty"}
                value={newValue.icon}
                onSelect={(icon: string | undefined) =>
                  icon && setNewValue((v) => ({ ...v, icon }))
                }
                iconSize={24}
                searchPlaceholder="Pick icon"
                defaultIcon="mood-smile"
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
                  style={{ width: 32, textAlign: "right", paddingRight: 4 }}
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
                  description: e.target.value.slice(0, 100)
                }))
              }
              minRows={2}
              maxRows={2}
              autosize
              maxLength={100}
              style={{
                width: "100%",
                marginTop: 4,
                textAlign: "start"
              }}
              rightSection={
                <Text
                  size="xs"
                  c={newValue.description.length >= 100 ? "red" : "dimmed"}
                  style={{
                    width: 75,
                    textAlign: "left",
                    paddingRight: 4,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere"
                  }}
                >
                  {newValue.description.length}/ 100
                </Text>
              }
            />
            <Button
              type="button"
              size="xs"
              mt={8}
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
        </Group>
      </Stack>
    </Stack>
  );
}
