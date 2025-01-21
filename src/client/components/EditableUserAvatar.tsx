import React, { useEffect, useState } from "react";
import { type Maybe } from "~/utils/types";
import { useRouter } from "next/navigation";
import { User } from "~/server/service/types";
import createStorageClient from "~/client/utils/storageClient";
import {
  ActionIcon,
  Avatar,
  Box,
  Input,
  Stack,
  StackProps,
  Text,
  Title
} from "@mantine/core";
import { IconArrowUp } from "@tabler/icons-react";

type EditableUserAvatarProps = {
  user: User;
};

// 5 megabytes
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function EditableUserAvatar({
  user,
  ...props
}: EditableUserAvatarProps & StackProps) {
  const router = useRouter();
  const storageClient = createStorageClient();
  const [userProfileImageUrl, setUserProfileImageUrl] =
    useState<Maybe<string>>(null);

  useEffect(() => {
    const fetchUserProfileImageUrl = async () => {
      const url = await storageClient.userProfileImageUrl();
      setUserProfileImageUrl(url);
    };
    void fetchUserProfileImageUrl();
  }, []);

  const handleUserProfileImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    // validations
    // TODO more graceful error handling
    if (file.size === 0) {
      throw new Error("User profile image file was empty");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("User profile image file cannot be greater than 5MB");
    }
    await storageClient.uploadUserProfileImage(user.id, file);
    router.refresh();
  };

  return (
    <Stack gap={"xs"} {...props}>
      <Title order={6}>Profile Picture</Title>
      <Box style={{ position: "relative" }}>
        <Avatar size={100} src={userProfileImageUrl ?? undefined} />
        <Input
          type={"file"}
          accept="image/*"
          id={"profile-picture-input"}
          display={"none"}
          onChange={handleUserProfileImageChange}
        />
        <ActionIcon
          component="label"
          htmlFor="profile-picture-input"
          variant="filled"
          radius="xl"
          size="sm"
          color="black"
          aria-label="Upload Profile Picture"
          style={{ position: "absolute", right: 6, bottom: 0 }}
        >
          <IconArrowUp />
        </ActionIcon>
      </Box>
    </Stack>
  );
}
