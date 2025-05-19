import { Box, Button, NumberInput } from "@mantine/core";
import React from "react";
import { Maybe } from "~/utils/types";
import { IconPlus, IconX } from "@tabler/icons-react";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";

type CostInputProps = {
  value: number;
  defaultValue: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function CostInput({
  value,
  onChange,
  defaultValue,
  // these match the MonetaryValue zod schema
  min = 1,
  max = 1000
}: CostInputProps) {
  return (
    <NumberInput
      value={value}
      defaultValue={defaultValue}
      onChange={(val) => onChange(Number(val))}
      error={
        value < min
          ? `Amount cannot be less than $${min}`
          : value > max
            ? `Amount cannot exceed $${max}`
            : null
      }
      min={min}
      max={max}
      required
      allowNegative={false}
      allowDecimal={false}
      maxLength={5}
      hideControls
      prefix="$"
      styles={{
        input: {
          border: "none",
          background: "transparent",
          fontSize: 32,
          textAlign: "center",
          width: "100%"
        },
        error: {
          textAlign: "center",
          width: "100%",
          marginTop: 8
        }
      }}
    />
  );
}

type NullableCostInputProps = {
  value: Maybe<number>;
  defaultValue: number;
  onChange: (value: Maybe<number>) => void;
  min?: number;
  max?: number;
};

export function NullableCostInput({
  value,
  onChange,
  defaultValue,
  min = 1,
  max = 1000
}: NullableCostInputProps) {
  if (value === null) {
    return (
      <Button
        variant="subtle"
        size="sm"
        leftSection={<IconPlus size={16} />}
        onClick={() => onChange(defaultValue)}
      >
        Add one-time fee
      </Button>
    );
  }

  return (
    <Box style={{ position: "relative", width: "100%" }}>
      <ColorSchemeAwareActionIcon
        variant="subtle"
        color="gray"
        onClick={() => onChange(null)}
        style={{
          position: "absolute",
          top: "-8px",
          right: "-8px",
          zIndex: 2
        }}
      >
        <IconX size={16} />
      </ColorSchemeAwareActionIcon>
      <CostInput
        value={value}
        onChange={onChange}
        defaultValue={defaultValue}
        min={min}
        max={max}
      />
    </Box>
  );
}
