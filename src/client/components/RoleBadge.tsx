import { Role } from "~/server/membership/types";
import { Badge } from "@mantine/core";
import React from "react";

type RoleBadgeProps = {
  role: Role;
  hideMember?: boolean;
};

export default function RoleBadge({
  role,
  hideMember = false
}: RoleBadgeProps) {
  if (role === "LEAD") {
    return <Badge color="orange">{role}</Badge>;
  }
  if (!hideMember && role === "MEMBER") {
    return <Badge color="grey">{role}</Badge>;
  }
  return null;
}
