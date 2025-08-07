/*
  # Create date_requests table

  1. New Tables
    - `date_requests`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references profiles.id)
      - `receiver_id` (uuid, references profiles.id)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `date_requests` table
    - Add policies for users to manage their own date requests

  3. Constraints
    - Unique constraint to prevent duplicate requests
    - Check constraint for valid status values
*/

CREATE TABLE IF NOT EXISTS date_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE date_requests ENABLE ROW LEVEL SECURITY;

-- Users can view date requests they sent or received
CREATE POLICY "Users can view their date requests"
  ON date_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can create date requests
CREATE POLICY "Users can create date requests"
  ON date_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Users can update date requests they received
CREATE POLICY "Users can update received date requests"
  ON date_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_date_requests_sender_id ON date_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_date_requests_receiver_id ON date_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_date_requests_status ON date_requests(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_date_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_date_requests_updated_at
  BEFORE UPDATE ON date_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_date_requests_updated_at();