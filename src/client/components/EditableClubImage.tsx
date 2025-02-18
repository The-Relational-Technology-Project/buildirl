import React from "react";
import { type Maybe } from "~/utils/types";
import { ActionIcon, Box, BoxProps, FileInput, Image } from "@mantine/core";
import { IconArrowUp } from "@tabler/icons-react";
import createStorageClient from "~/client/utils/storageClient";
import { checkFileSize } from "~/client/components/EditableUserAvatar";

type EditableImageProps = {
  clubId: number;
};

export default function EditableClubImage({
  clubId,
  ...props
}: EditableImageProps & BoxProps) {
  const storageClient = createStorageClient();

  const handleFileUpload = async (file: Maybe<File>) => {
    if (!file) {
      return;
    }

    checkFileSize(file);

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
        fallbackSrc={"/images/club-profile-fallback.png"}
        alt={"club profile"}
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
        color={"black"}
        aria-label="Upload Club Profile Picture"
        style={{ position: "absolute", right: 0, bottom: 0 }}
      >
        <IconArrowUp />
      </ActionIcon>
    </Box>
  );
}
