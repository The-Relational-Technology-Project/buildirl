import React from "react";
import { Stack, StackProps } from "@mantine/core";
import { Membership, User } from "~/server/service/types";
import UserProfileHeader from "~/client/components/UserProfileHeader";
import UserBio from "~/client/components/UserBio";
import MembershipStatusBadge from "~/client/components/MembershipStatusBadge";
import MembershipDetails from "~/client/components/MembershipDetails";

type MemberProfileProps = {
  user: User;
  membership: Membership;
  isPending: boolean;
  width?: number | string;
} & StackProps;

export default function MemberProfile({
  user,
  membership,
  isPending,
  width = 600,
  ...stackProps
}: MemberProfileProps) {
  return (
    <Stack w={width} {...stackProps}>
      <UserProfileHeader 
        user={user} 
        avatarSize="lg"
        titleOrder={2}
        showClickable={true}
      >
        <MembershipStatusBadge isPending={isPending} />
      </UserProfileHeader>
      
      <UserBio 
        description={user.description}
        showDivider={true}
        showTitle={false}
        textSize="sm"
      />
      
      <MembershipDetails 
        membership={membership}
        isPending={isPending}
      />
    </Stack>
  );
} 