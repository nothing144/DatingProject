/*
  # Create date requests table

  1. New Tables
    - `date_requests`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references profiles)
      - `receiver_id` (uuid, references profiles)
      - `status` (text, enum: pending/accepted/rejected)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `date_requests` table
    - Add policies for users to manage their own date requests
    - Add unique constraint to prevent duplicate requests

  3. Functions
    - Add trigger for updating updated_at timestamp
</sql>

-- Create the date_requests table
CREATE TABLE IF NOT EXISTS date_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_date_requests_sender_id ON date_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_date_requests_receiver_id ON date_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_date_requests_status ON date_requests(status);

-- Enable RLS
ALTER TABLE date_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create date requests"
  ON date_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their date requests"
  ON date_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can update received date requests"
  ON date_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_date_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_date_requests_updated_at
  BEFORE UPDATE ON date_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_date_requests_updated_at();