import { Maybe } from "~/utils/types";
import { Select } from "@mantine/core";
import { FONT_SELECTION } from "~/client/theme/templates";
import React from "react";

type FontSelectorProps = {
  value: Maybe<string>;
  onChange: (theme: Maybe<string>) => void;
};

export default function FontSelector({ value, onChange }: FontSelectorProps) {
  return (
    <Select
      defaultValue={value}
      data={FONT_SELECTION}
      onChange={onChange}
      styles={{
        input: { border: "1px solid black", borderRadius: 0 },
        dropdown: { border: "1px solid black", borderRadius: 0 }
      }}
    />
  );
}
