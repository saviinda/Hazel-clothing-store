-- Remove foreign key constraint from users table to allow direct user creation
-- Run this in Supabase SQL Editor

-- Drop the foreign key constraint
ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;

-- The users table will now allow inserting records without requiring auth.users to exist
-- Users can sign up later to link their auth account
