import React from "react";
import { type Maybe } from "~/utils/types";
import { ActionIcon, Box, BoxProps, FileInput, Image } from "@mantine/core";
import { IconArrowUp } from "@tabler/icons-react";
import createStorageClient from "~/client/utils/storageClient";

type EditableImageProps = {
  clubId: number;
};

// 5 megabytes
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function EditableClubImage({
  clubId,
  ...props
}: EditableImageProps & BoxProps) {
  const storageClient = createStorageClient();

  const handleFileUpload = async (file: Maybe<File>) => {
    if (!file) {
      return;
    }
    // validations
    // TODO more graceful error handling
    if (file.size === 0) {
      throw new Error("Club profile image file was empty");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("Club profile image file cannot be greater than 5MB");
    }
    await storageClient.uploadClubProfileImage(clubId, file);
    // force a full refresh of the page so all image references
    // can pick up new upload
    window.location.reload();
  };

  return (
    <Box w={180} h={180} p={8} style={{ position: "relative" }} {...props}>
      <Image
        radius="md"
        w={"100%"}
        h={"100%"}
        src={storageClient.clubProfileImageUrl(clubId)}
        fallbackSrc={"/club-profile-fallback.png"}
      />
      <FileInput
        accept="image/*"
        id={"club-profile-picture-input"}
        display={"none"}
        onChange={handleFileUpload}
      />
      <ActionIcon
        component="label"
        htmlFor="club-profile-picture-input"
        variant="filled"
        radius="xl"
        size="sm"
        color="black"
        aria-label="Upload Club Profile Picture"
        style={{ position: "absolute", right: 0, bottom: 0 }}
      >
        <IconArrowUp />
      </ActionIcon>
    </Box>
  );
}
