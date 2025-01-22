import React from "react";
import { type Maybe } from "~/utils/types";
import { User } from "~/server/service/types";
import createStorageClient from "~/client/utils/storageClient";
import {
  ActionIcon,
  Avatar,
  Box,
  FileInput,
  Stack,
  StackProps,
  Title
} from "@mantine/core";
import { IconArrowUp } from "@tabler/icons-react";

type EditableUserAvatarProps = {
  user: User;
};

// 5 megabytes
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function EditableUserAvatar({
  user
}: EditableUserAvatarProps & StackProps) {
  const storageClient = createStorageClient();

  const handleUserProfileImageChange = async (file: Maybe<File>) => {
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
    // force a full refresh of the page so all image references
    // can pick up new upload
    window.location.reload();
  };

  return (
    <Box w={100} h={100} style={{ position: "relative" }}>
      <Avatar size={100} src={storageClient.userProfileImageUrl(user.id)} />
      <FileInput
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
  );
}
