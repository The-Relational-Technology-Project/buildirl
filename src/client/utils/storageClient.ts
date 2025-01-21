import { createComponentClient } from "~/utils/supabase/auth/client";
import { type Maybe } from "~/utils/types";
import { logger } from "~/client/logger";

export type StorageClient = {
  uploadUserProfileImage(userId: number, image: File): Promise<void>;
  userProfileImageUrl(userId: number): Maybe<string>;
};

/**
 * tRPC does not do a good job handling file uploads as it serializes everything into JSON,
 * so we circumvent it and use this direct client for upload mutations
 */
export default function createStorageClient(): StorageClient {
  const supabaseClient = createComponentClient();

  async function authUserId() {
    const authUser = await supabaseClient.auth.getUser();
    const id = authUser.data.user?.id;
    if (undefined === id) {
      throw new Error("expected an authorized user");
    }
    return id;
  }

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
        `failed to upload profile image for user with id ${userId}: ${error.message}`
      );
    }
  }

  function userProfileImageRelativeUrl(userId: number) {
    return `${userId}/profile`;
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

  return {
    uploadUserProfileImage,
    userProfileImageUrl
  };
}

export const storageClient = createStorageClient();
