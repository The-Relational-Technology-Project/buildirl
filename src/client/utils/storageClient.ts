import { createComponentClient } from "~/utils/supabase/auth/client";
import { logger } from "~/client/logger";
import { Url, UrlSchema } from "~/server/service/types";
import { parseAsZodType } from "~/utils/zod";

export type StorageClient = {
  uploadUserProfileImage(userId: number, image: File): Promise<void>;
  userProfileImageUrl(userId: number): Url;
  uploadClubProfileImage(clubId: number, image: File): Promise<void>;
  clubProfileImageUrl(clubId: number): Url;
  uploadClubDisplayImage(clubId: number, image: File): Promise<Url>;
  deleteClubDisplayImage(clubId: number, imageUrl: Url): Promise<void>;
};

const SUPABASE_PUBLIC_URL_REGEX =
  /^https:\/\/([a-zA-Z0-9-]+\.)?supabase\.co\/storage\/v1\/object\/public\/(?<filePath>.+)$/;

/**
 * tRPC does not do a good job handling file uploads as it serializes everything into JSON,
 * so we circumvent it and use this direct client for upload mutations
 */
export default function createStorageClient(): StorageClient {
  const supabaseClient = createComponentClient();

  async function uploadUserProfileImage(
    userId: number,
    profileImage: File
  ): Promise<void> {
    const { error } = await supabaseClient.storage
      .from("images")
      .upload(userProfileImageRelativeUrl(userId), profileImage, {
        upsert: true
      });
    logger.info(`uploaded profile image for user with id ${userId}`);
    if (error) {
      throw new Error(
        `failed to upload profile image for user with id ${userId} with exception ${error.message}`
      );
    }
  }

  async function uploadClubProfileImage(
    clubId: number,
    profileImage: File
  ): Promise<void> {
    const { error } = await supabaseClient.storage
      .from("images")
      .upload(clubProfileImageRelativeUrl(clubId), profileImage, {
        upsert: true
      });
    logger.info(`uploaded profile image for club with id ${clubId}`);
    if (error) {
      throw new Error(
        `failed to upload profile image for club with id ${clubId} with exception ${error.message}`
      );
    }
  }

  function userProfileImageRelativeUrl(userId: number) {
    return `user/${userId}/profile`;
  }

  function clubProfileImageRelativeUrl(clubId: number) {
    return `club/${clubId}/profile`;
  }

  // TODO selectively skip cache using local storage to persist skipCache state
  function userProfileImageUrl(userId: number) {
    const { data } = supabaseClient.storage
      .from("images")
      .getPublicUrl(userProfileImageRelativeUrl(userId));
    // add a time stamp to the url to bypass Next.js image cache
    // which can prevent image from updating on change
    // https://stackoverflow.com/questions/71450588/nextjs-image-cache-invalidation
    const timeStamp = new Date().getTime();
    return parseAsZodType(`${data.publicUrl}?v=${timeStamp}`, UrlSchema);
  }

  function clubProfileImageUrl(clubId: number) {
    const { data } = supabaseClient.storage
      .from("images")
      .getPublicUrl(clubProfileImageRelativeUrl(clubId));
    // add a time stamp to the url to bypass Next.js image cache
    // which can prevent image from updating on change
    // https://stackoverflow.com/questions/71450588/nextjs-image-cache-invalidation
    const timeStamp = new Date().getTime();
    return parseAsZodType(`${data.publicUrl}?v=${timeStamp}`, UrlSchema);
  }

  function clubDisplayImageRelativeUrl(clubId: number, fileName: string) {
    return `club/${clubId}/display/${fileName}`;
  }

  async function uploadClubDisplayImage(
    clubId: number,
    displayImage: File
  ): Promise<Url> {
    const filePath = clubDisplayImageRelativeUrl(clubId, displayImage.name);

    const { error } = await supabaseClient.storage
      .from("images")
      .upload(filePath, displayImage, {
        upsert: false
      });

    if (error) {
      throw new Error(
        `failed to upload display image for club with id ${clubId} with exception ${error.message}`
      );
    }

    const { data } = supabaseClient.storage
      .from("images")
      .getPublicUrl(filePath);

    const publicUrl = parseAsZodType(data.publicUrl, UrlSchema);

    logger.info(
      `uploaded display image for club with id ${clubId} at ${publicUrl}`
    );

    return publicUrl;
  }

  function relativeFilePathFromPublicUrl(imageUrl: Url): Url {
    const match = SUPABASE_PUBLIC_URL_REGEX.exec(imageUrl);
    if (!match || !match.groups?.filePath) {
      throw new Error("Url must be a valid Supabase storage public url");
    }
    return match.groups.filePath;
  }

  async function deleteClubDisplayImage(clubId: number, imageUrl: Url) {
    const filePath = relativeFilePathFromPublicUrl(imageUrl);

    const { error } = await supabaseClient.storage
      .from("images")
      .remove([filePath]);

    if (error) {
      throw new Error(
        `failed to delete display image for club with id ${clubId} with exception ${error.message}`
      );
    }

    logger.info(`deleted display image for club with id ${clubId}`);
  }

  return {
    uploadUserProfileImage,
    uploadClubProfileImage,
    userProfileImageUrl,
    clubProfileImageUrl,
    uploadClubDisplayImage,
    deleteClubDisplayImage
  };
}

export const storageClient = createStorageClient();
