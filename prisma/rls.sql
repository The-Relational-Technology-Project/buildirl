/*
   RLS policies must be defined and updated in version control here and applied manually
   Test DB: https://supabase.com/dashboard/project/raoharfnfnkuyabregez/auth/policies
   Test Bucket: https://supabase.com/dashboard/project/raoharfnfnkuyabregez/auth/policies
   Prod DB: https://supabase.com/dashboard/project/zepmgttkkbjigvvvbbce/auth/policies
   Prod Bucket: https://supabase.com/dashboard/project/raoharfnfnkuyabregez/storage/policies

   Follow the guide here for performance optimizations: https://supabase.com/docs/guides/auth/row-level-security
*/

/*
 DATABASE POLICIES
*/

-- Enable RLS on all tables to protect all tables from unauthenticated access via supabase public anon key
ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."club" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."membership_tier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."membership" ENABLE ROW LEVEL SECURITY;
-- This table has no defined RLS policies that allows access but the postgres user bypasses RLS
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- This is used for middleware onboarding status check
CREATE POLICY "Users can view their own data"
    ON "public"."user"
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = auth_user_id);


-- No other RLS policies, tables are restrictive to all clients. Backend prisma uses a connection which by-passes all RLS.
-- Database authorization is at the trpc level in abilities.ts and trpc routers

/*
 STORAGE POLICIES
 Technically these SELECT RLS policies are overridden by the fact that the images bucket is public
  but we include them here to track our precise intention

  TODO should we restrict this at the bucket level in the future?
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