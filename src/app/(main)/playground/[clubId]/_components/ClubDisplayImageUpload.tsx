import { useState } from "react";
import { Group, Image, ActionIcon } from "@mantine/core";
import { api } from "~/trpc/react";
import { storageClient } from "~/client/utils/storageClient";
import { Dropzone } from "@mantine/dropzone";
import { Club } from "~/server/service/types";

type ClubDisplayImageUploadProps = {
  club: Club;
};

export default function ClubDisplayImageUpload({
  club
}: ClubDisplayImageUploadProps) {
  const utils = api.useUtils();
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const updateClubDisplayImageUrlsMutation =
    api.main.updateClubDisplayImageUrls.useMutation({
      onSuccess: () => {
        utils.main.club.invalidate({ id: club.id });
        utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
        utils.main.userOwnedClubs.invalidate();
      }
    });

  const handleUpload = async (files: File[]) => {
    const newUrls = await Promise.all(
      files.map(async (file) => {
        return await storageClient.uploadClubDisplayImage(club.id, file);
      })
    );

    setUploadedUrls((prev) => [...prev, ...newUrls]);

    await updateClubDisplayImageUrlsMutation.mutateAsync({
      clubId: club.id,
      input: { displayImageUrls: uploadedUrls.concat(newUrls) }
    });
  };

  const handleDelete = async (url: string) => {
    await storageClient.deleteClubDisplayImage(club.id, url);

    const updatedUrls = uploadedUrls.filter((u) => u !== url);
    setUploadedUrls(updatedUrls);

    await updateClubDisplayImageUrlsMutation.mutateAsync({
      clubId: club.id,
      input: { displayImageUrls: updatedUrls }
    });
  };

  return (
    <Dropzone onDrop={handleUpload} maxFiles={5}>
      <Group>
        {uploadedUrls.map((url, index) => (
          <div key={index}>
            <Image src={url} alt={`Club Image ${index}`} width={100} />
            <ActionIcon onClick={() => handleDelete(url)}>x</ActionIcon>
          </div>
        ))}
      </Group>
    </Dropzone>
  );
}
