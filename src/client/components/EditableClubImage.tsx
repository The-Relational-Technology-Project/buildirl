import React from "react";
import { type Maybe } from "~/utils/types";
import {
  ActionIcon,
  Box,
  BoxProps,
  FileInput,
  Image,
  StyleProp
} from "@mantine/core";
import { IconArrowUp } from "@tabler/icons-react";
import createStorageClient from "~/client/utils/storageClient";
import { checkFileSize } from "~/client/components/EditableUserAvatar";
import { Club } from "~/server/service/types";
import ClubImage from "~/client/components/ClubImage";

type EditableImageProps = {
  club: Club;
  size: StyleProp<React.CSSProperties["width"]>;
};

export default function EditableClubImage({
  club,
  size,
  ...props
}: EditableImageProps & BoxProps) {
  const storageClient = createStorageClient();

  const handleFileUpload = async (file: Maybe<File>) => {
    if (!file) {
      return;
    }

    checkFileSize(file);

    await storageClient.uploadClubProfileImage(club.id, file);
    // force a full refresh of the page so all image references
    // can pick up new upload
    window.location.reload();
  };

  return (
    <Box w={size} h={size} p={8} style={{ position: "relative" }} {...props}>
      <ClubImage club={club} size={"100%"} />
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
