import React from "react";
import { HEADER_BAR_HEIGHT } from "~/client/components/HeaderBar";
import { Center, CenterProps } from "@mantine/core";

type AbsoluteCenterProps = {
  children: React.ReactNode;
  adjustForHeader?: boolean;
};

export default function AbsoluteCenter({
  children,
  adjustForHeader = false,
  ...props
}: AbsoluteCenterProps & CenterProps) {
  return (
    <Center
      h={`calc(100vh - ${adjustForHeader ? HEADER_BAR_HEIGHT : 0}px)`}
      pb={200}
      {...props}
    >
      {children}
    </Center>
  );
}
