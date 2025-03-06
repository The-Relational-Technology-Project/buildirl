import { Paper, PaperProps } from "@mantine/core";
import React from "react";

type HideablePaperProps = {
  children: React.ReactNode;
  hidden?: boolean;
};
export default function HideablePaper({
  children,
  hidden = false,
  ...props
}: HideablePaperProps & PaperProps) {
  if (hidden) {
    return children;
  }
  return <Paper {...props}>{children}</Paper>;
}
