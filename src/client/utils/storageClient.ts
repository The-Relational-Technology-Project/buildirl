import { createComponentClient } from "~/utils/supabase/auth/client";
import { logger } from "~/client/logger";

export type StorageClient = {
  uploadUserProfileImage(userId: number, image: File): Promise<void>;
  userProfileImageUrl(userId: number): string;
  uploadClubProfileImage(clubId: number, image: File): Promise<void>;
  clubProfileImageUrl(clubId: number): string;
};

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
    return `${data.publicUrl}?v=${timeStamp}`;
  }

  function clubProfileImageUrl(clubId: number) {
    const { data } = supabaseClient.storage
      .from("images")
      .getPublicUrl(clubProfileImageRelativeUrl(clubId));
    // add a time stamp to the url to bypass Next.js image cache
    // which can prevent image from updating on change
    // https://stackoverflow.com/questions/71450588/nextjs-image-cache-invalidation
    const timeStamp = new Date().getTime();
    return `${data.publicUrl}?v=${timeStamp}`;
  }

  return {
    uploadUserProfileImage,
    uploadClubProfileImage,
    userProfileImageUrl,
    clubProfileImageUrl
  };
}

export const storageClient = createStorageClient();
