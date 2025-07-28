"use client";

import { useState } from "react";
import { Text, Anchor } from "@mantine/core";

interface ExpandableTextProps {
  text: string;
  wordLimit?: number;
  className?: string;
}

export default function ExpandableText({
  text,
  wordLimit = 50,
  className
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const words = text.split(" ");
  const shouldTruncate = words.length > wordLimit;

  const displayText =
    isExpanded || !shouldTruncate
      ? text
      : words.slice(0, wordLimit).join(" ") + "...";

  if (!shouldTruncate) {
    return <Text className={className}>{text}</Text>;
  }

  return (
    <Text component="span" className={className}>
      {displayText}
      <Anchor
        component="button"
        onClick={() => setIsExpanded(!isExpanded)}
        ml="xs"
        fw={500}
        fz="sm"
      >
        {isExpanded ? "Read less" : "Read more"}
      </Anchor>
    </Text>
  );
}