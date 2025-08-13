// !! PROTOTYPE

"use client";

import { Card, CardProps } from "@mantine/core";
import { ReactNode } from "react";

interface SectionCardProps extends CardProps {
  children: ReactNode;
  decorative?: boolean;
}

export default function SectionCard({
  children,
  decorative = true,
  style,
  ...props
}: SectionCardProps) {
  return (
    <Card
      p={{ base: "md", md: "xl" }}
      pos="relative"
      style={{
        overflow: "hidden",
        background: "rgba(255, 255, 255, 0.3)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(122, 62, 218, 0.2)",
        boxShadow: "0 8px 32px rgba(122, 62, 218, 0.1)",
        display: "flex",
        flexDirection: "column",
        ...style
      }}
      {...props}
    >
      {decorative && (
        <>
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 80,
              height: 80,
              backgroundColor: "rgba(122, 62, 218, 0.1)",
              borderRadius: "50%",
              transform: "translate(40px, -40px)"
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: 64,
              height: 64,
              backgroundColor: "rgba(255, 200, 87, 0.1)",
              borderRadius: "50%",
              transform: "translate(-32px, 32px)"
            }}
          />
        </>
      )}

      <div style={{ position: "relative", zIndex: 10, flex: 1 }}>
        {children}
      </div>
    </Card>
  );
}
