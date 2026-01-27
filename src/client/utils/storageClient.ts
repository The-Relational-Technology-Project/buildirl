import { createComponentClient } from "~/utils/supabase/auth/client";
import { logger } from "~/client/logger";
import { Url, UrlSchema } from "~/server/utils/types";
import { parseAsZodType } from "~/utils/zod";

export type StorageClient = {
  uploadUserProfileImage(userId: number, image: File): Promise<void>;
  userProfileImageUrl(userId: number): Url;
  uploadClubProfileImage(clubId: number, image: File): Promise<void>;
  clubProfileImageUrl(clubId: number): Url;
  uploadClubDisplayImage(clubId: number, image: File): Promise<Url>;
  uploadMembershipTierCoverImage(
    clubId: number,
    image: File
  ): Promise<Url>;
  deleteMembershipTierCoverImage(clubId: number, imageUrl: Url): Promise<void>;
  deleteClubDisplayImage(clubId: number, imageUrl: Url): Promise<void>;
};

const IMAGE_BUCKET_PATH_REGEX =
  // do not care about hostname, just care about end path
  /\/storage\/v1\/object\/public\/images\/(?<relativeFilePath>.+)$/;

/**
 * tRPC does not do a good job handling file uploads as it serializes everything into JSON,
 * so we circumvent it and use this direct client for upload mutations
 *
 * TODO this is the only reason we need to expose the supabase public anon key, if we can move this to server
 *  we can increase security
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
      logger.error(
        error,
        `failed to upload profile image for user with id ${userId}`
      );
      throw error;
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
      logger.error(
        error,
        `failed to upload profile image for club with id ${clubId}`
      );
      throw error;
    }
  }

  function userProfileImageRelativeUrl(userId: number) {
    return `user/${userId}/profile`;
  }

  function clubProfileImageRelativeUrl(clubId: number) {
    return `club/${clubId}/profile`;
  }

  function sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  }

  // TODO selectively skip cache only on images that can be updated by user
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

  // TODO selectively skip cache only on images that can be updated by user
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
    const sanitizedFileName = sanitizeFileName(fileName);
    return `club/${clubId}/display/${sanitizedFileName}`;
  }

  function membershipTierCoverImageRelativeUrl(
    clubId: number,
    fileName: string
  ) {
    const sanitizedFileName = sanitizeFileName(fileName);
    return `membership-tier/${clubId}/cover/${Date.now()}-${sanitizedFileName}`;
  }

  function assertValidImageFile(file: File, maxFileSizeInMbs: number) {
    if (!file.type?.startsWith("image/")) {
      throw new Error(`file ${file.name} must be an image`);
    }
    if (file.size === 0) {
      throw new Error(`file ${file.name} was empty`);
    }
    if (file.size > maxFileSizeInMbs * 1024 * 1024) {
      throw new Error(
        `image file upload cannot be greater than ${maxFileSizeInMbs} MB but was ${file.size / (1024 * 1024)} MB`
      );
    }
  }

  async function uploadClubDisplayImage(
    clubId: number,
    displayImage: File
  ): Promise<Url> {
    assertValidImageFile(displayImage, 5);

    const filePath = clubDisplayImageRelativeUrl(clubId, displayImage.name);

    const { error } = await supabaseClient.storage
      .from("images")
      .upload(filePath, displayImage, {
        upsert: false
      });

    if (error) {
      logger.error(
        error,
        `failed to upload display image for club with id ${clubId}`
      );
      throw error;
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

  async function uploadMembershipTierCoverImage(
    clubId: number,
    coverImage: File
  ): Promise<Url> {
    assertValidImageFile(coverImage, 5);

    const filePath = membershipTierCoverImageRelativeUrl(
      clubId,
      coverImage.name
    );

    const { error } = await supabaseClient.storage
      .from("images")
      .upload(filePath, coverImage, {
        upsert: false
      });

    if (error) {
      logger.error(
        error,
        `failed to upload membership tier cover image for club with id ${clubId}`
      );
      throw error;
    }

    const { data } = supabaseClient.storage
      .from("images")
      .getPublicUrl(filePath);

    const publicUrl = parseAsZodType(data.publicUrl, UrlSchema);

    logger.info(
      `uploaded membership tier cover image for club with id ${clubId} at ${publicUrl}`
    );

    return publicUrl;
  }

  function decodedRelativeFilePathFromEncodedImageBucketPath(
    imageUrl: Url
  ): Url {
    const match = IMAGE_BUCKET_PATH_REGEX.exec(imageUrl);
    if (!match || !match.groups?.relativeFilePath) {
      throw new Error(
        `url ${imageUrl} must be a valid Supabase storage public url for \`images\` bucket`
      );
    }
    // we need to decode the path to interface with storage layer
    return decodeURIComponent(match.groups.relativeFilePath);
  }

  async function deleteClubDisplayImage(clubId: number, imageUrl: Url) {
    const filePath =
      decodedRelativeFilePathFromEncodedImageBucketPath(imageUrl);

    const { error } = await supabaseClient.storage
      .from("images")
      .remove([filePath]);

    if (error) {
      logger.error(
        error,
        `failed to delete display image for club with id ${clubId}`
      );
      throw error;
    }

    logger.info(`deleted display image for club with id ${clubId}`);
  }

  async function deleteMembershipTierCoverImage(
    clubId: number,
    imageUrl: Url
  ) {
    const filePath =
      decodedRelativeFilePathFromEncodedImageBucketPath(imageUrl);

    const { error } = await supabaseClient.storage
      .from("images")
      .remove([filePath]);

    if (error) {
      logger.error(
        error,
        `failed to delete membership tier cover image for club with id ${clubId}`
      );
      throw error;
    }

    logger.info(`deleted membership tier cover image for club with id ${clubId}`);
  }

  return {
    uploadUserProfileImage,
    uploadClubProfileImage,
    userProfileImageUrl,
    clubProfileImageUrl,
    uploadClubDisplayImage,
    uploadMembershipTierCoverImage,
    deleteClubDisplayImage,
    deleteMembershipTierCoverImage
  };
}

export const storageClient = createStorageClient();
