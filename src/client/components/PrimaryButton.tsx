import { Button, ButtonProps } from "@mantine/core";
import React from "react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useMounted } from "@mantine/hooks";

type PrimaryButtonProps = {
  children: React.ReactNode;
  includeIcon?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  type?: "submit" | "reset" | "button";
  fontFamily?: string;
};

const BASE_SHADOW = "6px 6px 0px #000";
const PRESSED_SHADOW = "2px 2px 0px #000";
const BASE_TRANSLATE = "translate(0, 0)";
const PRESSED_TRANSLATE = "translate(4px, 4px)";

export default function PrimaryButton({
  children,
  // default no-op
  onClick = () => {},
  includeIcon = false,
  type,
  fontFamily,
  ...props
}: PrimaryButtonProps & ButtonProps) {
  const mounted = useMounted();

  const applyPressedStyle = (target: HTMLButtonElement) => {
    target.style.transform = PRESSED_TRANSLATE;
    target.style.boxShadow = PRESSED_SHADOW;
  };

  const resetPressedStyle = (target: HTMLButtonElement) => {
    target.style.transform = BASE_TRANSLATE;
    target.style.boxShadow = BASE_SHADOW;
  };

  return (
    mounted && (
      <Button
        type={type}
        variant={"filled"}
        onClick={onClick}
        rightSection={includeIcon && <IconArrowUpRight />}
        size={"xl"}
        fz={{ base: "lg", md: "xl" }}
        w={{ base: 300, md: 400 }}
        onMouseDown={(event) => {
          applyPressedStyle(event.currentTarget);
        }}
        onMouseUp={(event) => {
          resetPressedStyle(event.currentTarget);
        }}
        onMouseLeave={(event) => {
          resetPressedStyle(event.currentTarget);
        }}
        onTouchStart={(event) => {
          applyPressedStyle(event.currentTarget);
        }}
        onTouchEnd={(event) => {
          resetPressedStyle(event.currentTarget);
        }}
        styles={{
          root: {
            backgroundColor: "#ffe680",
            color: "#0d0d0d",
            border: "2px solid #0d0d0d",
            boxShadow: BASE_SHADOW,
            borderRadius: 9999,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 700,
            fontFamily: fontFamily ?? undefined,
            transition: "transform 0.1s ease, box-shadow 0.1s ease",
            "&:hover": {
              backgroundColor: "#ffe680"
            },
            "&:active": {
              transform: PRESSED_TRANSLATE,
              boxShadow: PRESSED_SHADOW
            },
            "&:disabled": {
              opacity: 0.6,
              cursor: "not-allowed"
            }
          }
        }}
        {...props}
      >
        {children}
      </Button>
    )
  );
}
