import React, { useState } from "react";
import { type Maybe } from "~/utils/types";
import { ActionIcon, Box, BoxProps, FileInput } from "@mantine/core";
import { IconArrowUp } from "@tabler/icons-react";
import createStorageClient from "~/client/utils/storageClient";
import { isFileSizeValid } from "~/client/components/EditableUserAvatar";
import { Club } from "~/server/club/types";
import ClubImage from "~/client/components/ClubImage";
import { logger, notifyError } from "~/client/logger";
import { stringify } from "~/utils";

type EditableClubImageProps = {
  club: Club;
  size: number;
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
      logger.error(stringify(e), "failed to upload club profile image");
      notifyError(`${stringify(e)}`);
    }
  };

  return (
    // a bit hacky but this has to match the size of the ClubImage
    // which is scaled by .75
    <Box w={size} h={size * 0.75} {...props}>
      <ClubImage club={club} size={size} key={imageVersion} />
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
        style={{ position: "absolute", right: -5, bottom: -5 }}
      >
        <IconArrowUp />
      </ActionIcon>
    </Box>
  );
}
