-- Create the missing bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('rudhi-uploads', 'rudhi-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload donation proof images
CREATE POLICY "Authenticated users can upload donation proof"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'rudhi-uploads');

-- Allow anyone to view the donation proof images
CREATE POLICY "Anyone can view donation proof"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'rudhi-uploads');
