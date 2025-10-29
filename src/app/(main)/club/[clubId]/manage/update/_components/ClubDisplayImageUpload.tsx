import {
  Group,
  Image,
  FileInput,
  Box,
  Button,
  Center,
  ScrollArea,
  useMatches,
  ActionIcon
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { api } from "~/trpc/react";
import { storageClient } from "~/client/utils/storageClient";
import { Club } from "~/server/club/types";
import { Maybe } from "~/utils/types";
import { logger, notifyError } from "~/client/logger";
import { isFileSizeValid } from "~/client/components/EditableUserAvatar";
import { stringify } from "~/utils";

const MAX_DISPLAY_IMAGE_COUNT = 5;

interface ClubImageUploaderProps {
  club: Club;
}

export default function ClubImageUploader({ club }: ClubImageUploaderProps) {
  const size = useMatches({ base: 120, md: 200 });

  const utils = api.useUtils();

  const updateClubDisplayImageUrlsMutation =
    api.main.updateClubDisplayImageUrls.useMutation({
      onSuccess: (_, v) => {
        utils.main.club.invalidate({ id: v.clubId });
        utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
        utils.main.userMemberships.invalidate();
      }
      // no error handling because try-catch around both upload and mutation handles it
    });

  const handleUpload = async (file: Maybe<File>) => {
    if (!file) return;

    if (!isFileSizeValid(file, 5)) {
      return;
    }

    try {
      const url = await storageClient.uploadClubDisplayImage(club.id, file);

      const updatedUrls = [...club.displayImageUrls, url];

      await updateClubDisplayImageUrlsMutation.mutateAsync({
        clubId: club.id,
        input: { displayImageUrls: updatedUrls }
      });
    } catch (e) {
      logger.error(
        stringify(e),
        `failed to upload club display image ${file.name}`
      );
      notifyError(`${stringify(e)}`);
      return;
    }
  };

  const handleDelete = async (url: string) => {
    try {
      await storageClient.deleteClubDisplayImage(club.id, url);

      const updatedUrls = club.displayImageUrls.filter((u) => u !== url);

      await updateClubDisplayImageUrlsMutation.mutateAsync({
        clubId: club.id,
        input: { displayImageUrls: updatedUrls }
      });
    } catch (e) {
      logger.error(stringify(e), `failed to delete club display image ${url}`);
      notifyError(`${stringify(e)}`);
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
        disabled={club.displayImageUrls.length >= 5}
      />

      <ScrollArea type="never" h={size + 10}>
        <Group w={"max-content"}>
          {Array.from({ length: MAX_DISPLAY_IMAGE_COUNT }).map((_, index) => {
            const url = club.displayImageUrls[index];
            const isLeftmostEmptySlot = index === club.displayImageUrls.length;

            return (
              <Center
                key={index}
                w={size}
                h={size}
                style={{
                  position: "relative",
                  border: "1px dashed grey",
                  backgroundColor: "white"
                }}
              >
                {url ? (
                  <>
                    <Image src={url} w={"100%"} h={"100%"} fit="cover" />
                    <ActionIcon
                      style={{
                        position: "absolute",
                        bottom: -5,
                        right: -5,
                        borderRadius: 90
                      }}
                      variant={"filled"}
                      color={"red.5"}
                      size={"sm"}
                      onClick={() => handleDelete(url)}
                    >
                      <IconTrash color={"white"} size={16} />
                    </ActionIcon>
                  </>
                ) : isLeftmostEmptySlot ? (
                  <Button
                    component="label"
                    htmlFor="file-upload"
                    variant="transparent"
                    disabled={club.displayImageUrls.length >= 5}
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
