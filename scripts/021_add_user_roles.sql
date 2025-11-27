-- Add user roles and permissions system
-- This script adds admin roles and tracks member creation by wallet

-- Add admin wallets table
CREATE TABLE IF NOT EXISTS public.admin_wallets (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Add comment
COMMENT ON TABLE public.admin_wallets IS 'Stores wallet addresses that have admin privileges';

-- Add created_by field to community_members if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_members' 
    AND column_name = 'created_by_wallet'
  ) THEN
    ALTER TABLE public.community_members 
    ADD COLUMN created_by_wallet TEXT;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN public.community_members.created_by_wallet IS 'Wallet address that created this member';

-- Create index on created_by_wallet
CREATE INDEX IF NOT EXISTS idx_community_members_created_by_wallet 
ON public.community_members(created_by_wallet);

-- Create function to check if wallet is admin
CREATE OR REPLACE FUNCTION public.is_admin_wallet(wallet_addr TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_wallets 
    WHERE wallet_address = LOWER(wallet_addr) 
    AND is_active = true
  );
END;
$$;

-- Create function to get member count by wallet
CREATE OR REPLACE FUNCTION public.get_member_count_by_wallet(wallet_addr TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.community_members 
    WHERE created_by_wallet = LOWER(wallet_addr)
    AND is_active = true
  );
END;
$$;

-- Create function to check if wallet can create member
CREATE OR REPLACE FUNCTION public.can_create_member(wallet_addr TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
  member_count INTEGER;
BEGIN
  -- Check if admin
  is_admin := public.is_admin_wallet(wallet_addr);
  
  -- Admins can create unlimited members
  IF is_admin THEN
    RETURN true;
  END IF;
  
  -- Regular users can only create 1 member
  member_count := public.get_member_count_by_wallet(wallet_addr);
  RETURN member_count < 1;
END;
$$;

-- RLS Policies for admin_wallets
ALTER TABLE public.admin_wallets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin wallets are viewable by everyone" ON public.admin_wallets;
DROP POLICY IF EXISTS "Only admins can insert admin wallets" ON public.admin_wallets;
DROP POLICY IF EXISTS "Only admins can update admin wallets" ON public.admin_wallets;

-- Everyone can view admin list (to check permissions client-side)
CREATE POLICY "Admin wallets are viewable by everyone"
ON public.admin_wallets FOR SELECT
TO public
USING (true);

-- Only existing admins can add new admins
CREATE POLICY "Only admins can insert admin wallets"
ON public.admin_wallets FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_wallets 
    WHERE wallet_address = LOWER(auth.jwt()->>'wallet_address')
    AND is_active = true
  )
);

-- Only existing admins can update admin list
CREATE POLICY "Only admins can update admin wallets"
ON public.admin_wallets FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_wallets 
    WHERE wallet_address = LOWER(auth.jwt()->>'wallet_address')
    AND is_active = true
  )
);

-- Insert initial admin wallet (replace with your admin wallet address)
-- IMPORTANT: Update this with actual admin wallet address
INSERT INTO public.admin_wallets (wallet_address, created_by, is_active)
VALUES 
  (LOWER('0x2e21404e2b680E765c0c10301CE3987Cdb5C53af'), 'system', true)
ON CONFLICT (wallet_address) DO NOTHING;

-- Add comment about updating admin wallet
COMMENT ON TABLE public.admin_wallets IS 'Admin wallet addresses - UPDATE THE DEFAULT ADDRESS IN THE INSERT STATEMENT ABOVE';
