/* 
  Tables created through prisma (schema.prisma) are by default not secured by RLS

   RLS policies must be defined and updated in version control here and applied manually after schema migration
   via the supabase console:
   Test DB: https://supabase.com/dashboard/project/raoharfnfnkuyabregez/auth/policies
   Test Bucket: https://supabase.com/dashboard/project/raoharfnfnkuyabregez/auth/policies
   Prod DB: https://supabase.com/dashboard/project/zepmgttkkbjigvvvbbce/auth/policies
   Prod Bucket: https://supabase.com/dashboard/project/raoharfnfnkuyabregez/storage/policies

   Follow the guide here for performance optimizations: https://supabase.com/docs/guides/auth/row-level-security
 */

-- Enable RLS on all tables to protect all tables from unauthenticated access via supabase public anon key
ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."club" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."membership_tier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."membership" ENABLE ROW LEVEL SECURITY;
-- This table has no defined RLS policies that allows access but the postgres user bypasses RLS
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

/*
 DATABASE POLICIES
*/

-- Technically these SELECT RLS policies are overriden by the fact that the images bucket is public
-- but we include them here to track our precise intention
-- TODO should we restrict this at the bucket level in the future?

-- TODO this is more permissive than it needs to be across fields
CREATE POLICY "Public can view users"
ON "public"."user"
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can update their own data"
ON "public"."user"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = auth_user_id);

CREATE POLICY "Authenticated users can insert if not already in table"
ON "public"."user"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = auth_user_id
  AND NOT EXISTS (SELECT 1 FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
);

CREATE POLICY "Users can view their own settings"
ON "public"."user_settings"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM "user" WHERE id = user_id AND auth_user_id = (SELECT auth.uid()))
);

-- TODO this is more permissive than it needs to be across fields
CREATE POLICY "Club owners can view member settings for members of their club"
ON "public"."user_settings"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT m.user_id 
    FROM "membership" m
    JOIN "membership_tier" mt ON mt.id = m.membership_tier_id
    JOIN "club" c ON c.id = mt.club_id
    WHERE c.owner_user_id = (SELECT id FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
  )
);

CREATE POLICY "Users can update their own settings"
ON "public"."user_settings"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM "user" WHERE id = user_id AND auth_user_id = (SELECT auth.uid()))
);

CREATE POLICY "Users can insert their own settings"
ON "public"."user_settings"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM "user" WHERE id = user_id AND auth_user_id = (SELECT auth.uid()))
);

CREATE POLICY "Public can view clubs"
ON "public"."club"
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

CREATE POLICY "Club owners can update their own clubs"
ON "public"."club"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  owner_user_id = (SELECT id FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
);

CREATE POLICY "Club owners can delete their own clubs"
ON "public"."club"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  owner_user_id = (SELECT id FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
);

CREATE POLICY "Users can create clubs they own"
ON "public"."club"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  owner_user_id = (SELECT id FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
);

CREATE POLICY "Public can view membership tiers"
ON "public"."membership_tier"
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

CREATE POLICY "Club owners can update membership tiers"
ON "public"."membership_tier"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  club_id IN (
    SELECT id FROM "club" 
    WHERE owner_user_id = (SELECT id FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
  )
);

CREATE POLICY "Club owners can delete membership tiers"
ON "public"."membership_tier"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  club_id IN (
    SELECT id FROM "club" 
    WHERE owner_user_id = (SELECT id FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
  )
);

CREATE POLICY "Club owners can create membership tiers"
ON "public"."membership_tier"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  club_id IN (
    SELECT id FROM "club" 
    WHERE owner_user_id = (SELECT id FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
  )
);

-- TODO this is more permissive than it needs to be across fields
CREATE POLICY "Public can view memberships"
ON "public"."membership"
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can update their own memberships"
ON "public"."membership"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT id FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
);

-- TODO this is more permissive than it needs to be across fields
CREATE POLICY "Club owners can update memberships in their clubs"
ON "public"."membership"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  membership_tier_id IN (
    SELECT mt.id 
    FROM "membership_tier" mt
    JOIN "club" c ON c.id = mt.club_id
    WHERE c.owner_user_id = (SELECT id FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
  )
);

CREATE POLICY "Users can delete memberships"
ON "public"."membership"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  user_id = (SELECT id FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
);

CREATE POLICY "Users can create their own memberships"
ON "public"."membership"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT id FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
);

/*
 STORAGE POLICIES
*/

CREATE POLICY "Public can view club images"
ON storage.objects 
AS PERMISSIVE
FOR SELECT
TO public
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'club'
);

-- TODO should we restrict this in the future?
CREATE POLICY "Public can view user images"
ON storage.objects 
AS PERMISSIVE
FOR SELECT
TO public
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'user'
);

CREATE POLICY "Users can upload their own profile images"
ON storage.objects 
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'user' AND
  (storage.foldername(name))[2] = (SELECT id::text FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
);

CREATE POLICY "Users can update their own profile images"
ON storage.objects 
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'user' AND
  (storage.foldername(name))[2] = (SELECT id::text FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects 
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'user' AND
  (storage.foldername(name))[2] = (SELECT id::text FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
);

CREATE POLICY "Club owners can upload images to their club"
ON storage.objects 
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'club' AND
  (storage.foldername(name))[2] IN (
    SELECT id::text FROM "club"
    WHERE owner_user_id = (SELECT id FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
  )
);

CREATE POLICY "Club owners can update images for their club"
ON storage.objects 
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'club' AND
  (storage.foldername(name))[2] IN (
    SELECT id::text FROM "club"
    WHERE owner_user_id = (SELECT id FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
  )
);

CREATE POLICY "Club owners can delete images from their club"
ON storage.objects 
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'club' AND
  (storage.foldername(name))[2] IN (
    SELECT id::text FROM "club"
    WHERE owner_user_id = (SELECT id FROM "user" WHERE auth_user_id = (SELECT auth.uid()))
  )
);
