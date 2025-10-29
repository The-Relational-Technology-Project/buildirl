import { Stack, Button } from "@mantine/core";
import { useState, useRef, useLayoutEffect, ReactNode } from "react";

type ReadMoreBoxProps = {
  children: ReactNode;
  maxLines?: number;
  style?: React.CSSProperties;
  className?: string;
};

export function ReadMoreBox({
  children,
  maxLines = 10,
  style,
  className
}: ReadMoreBoxProps) {
  const [expanded, setExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const collapsed = !expanded && showButton;

  useLayoutEffect(() => {
    if (textRef.current) {
      const lineHeight = parseFloat(
        getComputedStyle(textRef.current).lineHeight || "20"
      );
      const lines = textRef.current.scrollHeight / lineHeight;
      setShowButton(lines > maxLines);
    }
  }, [children, maxLines]);

  return (
    <Stack
      gap={0}
      mb={{ base: "sm", md: "lg" }}
      className={className}
      style={{
        border: "1.5px solid #000000",
        borderRadius: 4,
        padding: "16px",
        ...style
      }}
    >
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
          variant="subtle"
          size="xs"
          onClick={() => setExpanded((v) => !v)}
          style={{ marginTop: 4 }}
        >
          {expanded ? "Collapse" : "Read more"}
        </Button>
      )}
    </Stack>
  );
}
