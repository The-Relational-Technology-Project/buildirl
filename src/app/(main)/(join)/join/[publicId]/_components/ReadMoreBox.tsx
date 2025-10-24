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
          maxHeight: !expanded && showButton ? `${maxLines * 1.5}em` : "none",
          overflow: !expanded && showButton ? "hidden" : "visible",
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
              height: "2em",
              background:
                "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%,rgba(0, 0, 0, 0.1) 65%, rgba(0, 0, 0, 0.2) 100%)"
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
