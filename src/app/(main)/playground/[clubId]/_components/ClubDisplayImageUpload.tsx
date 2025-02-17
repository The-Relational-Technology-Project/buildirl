import { useState } from "react";
import {
  Group,
  Image,
  FileInput,
  Box,
  Button,
  Center,
  ScrollArea
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { api } from "~/trpc/react";
import { storageClient } from "~/client/utils/storageClient";
import { Club } from "~/server/service/types";
import { Maybe } from "~/utils/types";
import { logger } from "~/client/logger";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";

const MAX_DISPLAY_IMAGE_COUNT = 5;

interface ClubImageUploaderProps {
  club: Club;
}

export default function ClubImageUploader({ club }: ClubImageUploaderProps) {
  const utils = api.useUtils();
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>(
    club.displayImageUrls
  );

  const updateClubDisplayImageUrlsMutation =
    api.main.updateClubDisplayImageUrls.useMutation({
      onSuccess: () => {
        utils.main.club.invalidate({ id: club.id });
        utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
        utils.main.userOwnedClubs.invalidate();
      }
    });

  const handleUpload = async (file: Maybe<File>) => {
    if (!file) return;

    try {
      const url = await storageClient.uploadClubDisplayImage(club.id, file);

      const updatedUrls = [...uploadedImageUrls, url];
      setUploadedImageUrls(updatedUrls);

      await updateClubDisplayImageUrlsMutation.mutateAsync({
        clubId: club.id,
        input: { displayImageUrls: updatedUrls }
      });
    } catch (error) {
      logger.error(
        `failed to upload club display image ${file.name} with exception ${error}`
      );
    }
  };

  const handleDelete = async (url: string) => {
    try {
      await storageClient.deleteClubDisplayImage(club.id, url);

      const updatedUrls = uploadedImageUrls.filter((u) => u !== url);
      setUploadedImageUrls(updatedUrls);

      await updateClubDisplayImageUrlsMutation.mutateAsync({
        clubId: club.id,
        input: { displayImageUrls: updatedUrls }
      });
    } catch (error) {
      logger.error(
        `failed to upload club display image ${url} with exception ${error}`
      );
    }
  };

  return (
    <Box>
      <FileInput
        accept="image/*"
        onChange={handleUpload}
        placeholder="Click to upload an image"
        style={{ display: "none" }}
        id="file-upload"
        // all slots are filled
        disabled={uploadedImageUrls.length >= 5}
      />

      <ScrollArea type="never" h={120}>
        <Group w={"max-content"}>
          {Array.from({ length: MAX_DISPLAY_IMAGE_COUNT }).map((_, index) => {
            const url = uploadedImageUrls[index];
            const isLeftmostEmptySlot = index === uploadedImageUrls.length;

            return (
              <Center
                key={index}
                style={{
                  position: "relative",
                  width: 100,
                  height: 100,
                  border: "1px dashed grey"
                }}
              >
                {url ? (
                  <>
                    <Image
                      src={url}
                      w={"100%"}
                      h={"100%"}
                      style={{
                        objectFit: "cover"
                      }}
                    />
                    <ColorSchemeAwareActionIcon
                      style={{
                        position: "absolute",
                        bottom: -5,
                        right: -5,
                        borderRadius: 90
                      }}
                      color={"red.5"}
                      size={"sm"}
                      onClick={() => handleDelete(url)}
                    >
                      <IconTrash color={"white"} size={16} />
                    </ColorSchemeAwareActionIcon>
                  </>
                ) : isLeftmostEmptySlot ? (
                  <Button
                    component="label"
                    htmlFor="file-upload"
                    variant="transparent"
                    disabled={uploadedImageUrls.length >= 5}
                  >
                    <IconPlus size={24} />
                  </Button>
                ) : null}
              </Center>
            );
          })}
        </Group>
      </ScrollArea>
    </Box>
  );
}
