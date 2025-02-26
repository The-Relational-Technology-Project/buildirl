import React from "react";
import { type Maybe } from "~/utils/types";
import createStorageClient from "~/client/utils/storageClient";
import { ActionIcon, AvatarProps, Box, FileInput } from "@mantine/core";
import { IconArrowUp } from "@tabler/icons-react";
import { User } from "~/server/service/types";
import UserAvatar from "~/client/components/UserAvatar";
import { logger, notifyError } from "~/client/logger";

type EditableUserAvatarProps = {
  user: User;
};

// 2 megabytes
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// returns whether the file size is valid
export function isFileSizeValid(file: File): boolean {
  if (file.size === 0) {
    logger.error(`image file ${file.name} was empty`);
    notifyError("Uploaded image was empty.");
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    logger.error(
      `image file upload cannot be greater than 2 MB but was ${file.size / (1024 * 1024)} MB`
    );
    notifyError("Uploaded image cannot be greater than 2 MB.");
    return false;
  }
  return true;
}

export default function EditableUserAvatar({
  user
}: EditableUserAvatarProps & AvatarProps) {
  const storageClient = createStorageClient();

  const handleFileUpload = async (file: Maybe<File>) => {
    if (!file) {
      return;
    }

    if (!isFileSizeValid(file)) {
      return;
    }

    await storageClient.uploadUserProfileImage(user.id, file);
    // force a full refresh of the page so all image references
    // can pick up new upload
    window.location.reload();
  };

  return (
    <Box w={120} h={120} style={{ position: "relative" }}>
      <UserAvatar user={user} size={"lg"} />
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
