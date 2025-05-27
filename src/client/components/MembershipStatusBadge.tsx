import React from "react";
import { Badge, BadgeProps } from "@mantine/core";

type MembershipStatusBadgeProps = {
  isPending: boolean;
} & Omit<BadgeProps, "color" | "children">;

export default function MembershipStatusBadge({
  isPending,
  variant = "light",
  size = "lg",
  ...badgeProps
}: MembershipStatusBadgeProps) {
  return (
    <Badge 
      color={isPending ? "yellow" : "green"} 
      variant={variant}
      size={size}
      {...badgeProps}
    >
      {isPending ? "Pending" : "Active Member"}
    </Badge>
  );
} 