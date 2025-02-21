import React from "react";
import { type Maybe } from "~/utils/types";
import createStorageClient from "~/client/utils/storageClient";
import { ActionIcon, AvatarProps, Box, FileInput } from "@mantine/core";
import { IconArrowUp } from "@tabler/icons-react";
import { User } from "~/server/service/types";
import UserAvatar from "~/client/components/UserAvatar";

type EditableUserAvatarProps = {
  user: User;
};

// 5 megabytes
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export function checkFileSize(file: File) {
  // TODO more graceful error handling
  if (file.size === 0) {
    throw new Error(`image file ${file.name} was empty`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `image file upload cannot be greater than 2MB but was ${file.size} bytes`
    );
  }
}

export default function EditableUserAvatar({
  user
}: EditableUserAvatarProps & AvatarProps) {
  const storageClient = createStorageClient();

  const handleFileUpload = async (file: Maybe<File>) => {
    if (!file) {
      return;
    }

    checkFileSize(file);

    await storageClient.uploadUserProfileImage(user.id, file);
    // force a full refresh of the page so all image references
    // can pick up new upload
    window.location.reload();
  };

  return (
    <Box w={120} h={120} style={{ position: "relative" }}>
      <UserAvatar user={user} size={"md"} />
      <FileInput
        accept="image/*"
        id={"profile-picture-input"}
        display={"none"}
        onChange={handleFileUpload}
      />
      <ActionIcon
        component="label"
        htmlFor="profile-picture-input"
        variant="filled"
        radius="xl"
        size="sm"
        color={"black"}
        aria-label="Upload Profile Picture"
        style={{ position: "absolute", right: 8, bottom: 2 }}
      >
        <IconArrowUp />
      </ActionIcon>
    </Box>
  );
}
