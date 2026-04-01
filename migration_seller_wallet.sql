-- Create seller_transfers table for wallet transfers
CREATE TABLE IF NOT EXISTS seller_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  account_number VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT seller_transfers_seller_id_fk FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS seller_transfers_seller_id_idx ON seller_transfers(seller_id);
CREATE INDEX IF NOT EXISTS seller_transfers_status_idx ON seller_transfers(status);
CREATE INDEX IF NOT EXISTS seller_transfers_created_at_idx ON seller_transfers(created_at DESC);

-- Add account_number column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);

-- Add account_number column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20);

-- Ensure users table has seller_id reference if needed
-- This is optional depending on your schema structure

-- Enable RLS (Row Level Security) for seller_transfers if needed
ALTER TABLE seller_transfers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (optional - only if you want to recreate them)
-- DROP POLICY IF EXISTS seller_transfers_select_policy ON seller_transfers;
-- DROP POLICY IF EXISTS seller_transfers_insert_policy ON seller_transfers;

-- Create policy to allow sellers to view only their own transfers
-- Uncomment the DROP POLICY lines above if you need to recreate policies
-- CREATE POLICY seller_transfers_select_policy ON seller_transfers
-- FOR SELECT USING (seller_id::text = auth.uid()::text);

-- Create policy to allow sellers to insert their own transfers
-- CREATE POLICY seller_transfers_insert_policy ON seller_transfers
-- FOR INSERT WITH CHECK (seller_id::text = auth.uid()::text);
