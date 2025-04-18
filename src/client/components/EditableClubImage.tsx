import React, { useState } from "react";
import { type Maybe } from "~/utils/types";
import { ActionIcon, Box, BoxProps, FileInput, StyleProp } from "@mantine/core";
import { IconArrowUp } from "@tabler/icons-react";
import createStorageClient from "~/client/utils/storageClient";
import { isFileSizeValid } from "~/client/components/EditableUserAvatar";
import { Club } from "~/server/service/types";
import ClubImage from "~/client/components/ClubImage";
import { logger, notifyError } from "~/client/logger";

type EditableClubImageProps = {
  club: Club;
  size: StyleProp<React.CSSProperties["width"]>;
};

export default function EditableClubImage({
  club,
  size,
  ...props
}: EditableClubImageProps & BoxProps) {
  const storageClient = createStorageClient();
  const [imageVersion, setImageVersion] = useState(0);

  const handleFileUpload = async (file: Maybe<File>) => {
    if (!file) {
      return;
    }

    if (!isFileSizeValid(file, 2)) {
      return;
    }

    try {
      await storageClient.uploadClubProfileImage(club.id, file);
      // increment version to force re-render with new image URL
      setImageVersion((prev) => prev + 1);
    } catch (e) {
      logger.error(e, "failed to upload club profile image");
      notifyError("Failed to upload club profile image.");
    }
  };

  return (
    <Box w={size} h={size} p={8} style={{ position: "relative" }} {...props}>
      <ClubImage club={club} size={"100%"} key={imageVersion} />
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
