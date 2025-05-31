import React from "react";
import { Stack, StackProps, Paper } from "@mantine/core";
import { User } from "~/server/service/types";
import UserProfileHeader from "~/client/components/UserProfileHeader";
import UserBio from "~/client/components/UserBio";

type MemberProfileProps = {
  user: User;
} & StackProps;

export default function MemberProfile({
  user,
  ...stackProps
}: MemberProfileProps) {
  return (
    <Paper p="xl">
      <Stack align="center" {...stackProps}>
        <UserProfileHeader 
          user={user} 
          avatarSize="lg"
          titleOrder={2}
          showClickable={true}
        />
        
        <UserBio 
          description={user.description}
          showDivider={true}
          showTitle={false}
          textSize="sm"
        />
      </Stack>
    </Paper>
  );
} 