import {
  Stack,
  Button,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { useState, useRef, useLayoutEffect, ReactNode } from "react";

type ReadMoreBoxProps = {
  children: ReactNode;
  header?: ReactNode;
  maxLines?: number;
  expandLabel?: string;
  collapseLabel?: string;
  style?: React.CSSProperties;
  className?: string;
};

export function ReadMoreBox({
  children,
  header,
  maxLines = 10,
  expandLabel = "Read more",
  collapseLabel = "Collapse",
  style,
  className
}: ReadMoreBoxProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const sectionTextColor = theme.other.dark.text;
  const buttonColor =
    colorScheme === "dark" ? sectionTextColor : theme.other.dark.ink;

  const [expanded, setExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const collapsed = !expanded && showButton;

  useLayoutEffect(() => {
    if (textRef.current) {
      let lineHeight = parseFloat(
        getComputedStyle(textRef.current).lineHeight || "20"
      );
      if (!lineHeight || Number.isNaN(lineHeight)) {
        const firstChild = textRef.current.firstElementChild;
        lineHeight = parseFloat(
          (firstChild && getComputedStyle(firstChild).lineHeight) || "20"
        );
      }
      const lines = textRef.current.scrollHeight / lineHeight;
      setShowButton(lines > maxLines);
    }
  }, [children, maxLines]);

  return (
    <Stack
      gap={0}
      mb={{ base: "sm", md: "lg" }}
      className={className}
      align="center"
      style={{
        borderRadius: 4,
        padding: "24px",
        ...style,
        backgroundColor:
          colorScheme === "dark"
            ? theme.other.dark.surface
            : theme.colors.beige![1],
        color: colorScheme === "dark" ? sectionTextColor : undefined
      }}
    >
      {header}
      <div
        ref={textRef}
        style={{
          width: "100%",
          overflow: collapsed ? "hidden" : "visible",
          display: collapsed ? "-webkit-box" : "block",
          WebkitLineClamp: collapsed ? maxLines : "unset",
          WebkitBoxOrient: collapsed ? "vertical" : "unset",
          textOverflow: collapsed ? "ellipsis" : "unset",
          position: "relative",
          transition: "max-height 0.2s"
        }}
      >
        {children}
        {!expanded && showButton && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "2em"
            }}
          />
        )}
      </div>
      {showButton && (
        <Button
          variant="outline"
          size="xs"
          onClick={() => setExpanded((v) => !v)}
          style={{
            marginTop: 16,
            backgroundColor: "transparent",
            border: `2px solid ${buttonColor}`,
            color: buttonColor,
            minHeight: "auto",
            height: "auto",
            width: "180px",
            padding: "8px 10px",
            fontSize: "0.75rem"
          }}
        >
          {expanded ? collapseLabel : expandLabel}
        </Button>
      )}
    </Stack>
  );
}
