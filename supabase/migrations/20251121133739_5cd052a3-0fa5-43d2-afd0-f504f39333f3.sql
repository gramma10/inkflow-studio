-- Create chairs table with working hours
CREATE TABLE public.chairs (
  id integer PRIMARY KEY,
  name text NOT NULL,
  start_hour integer NOT NULL DEFAULT 9,
  end_hour integer NOT NULL DEFAULT 22,
  created_at timestamptz DEFAULT now()
);

-- Insert 4 chairs
INSERT INTO public.chairs (id, name, start_hour, end_hour) VALUES
  (1, 'Καρέκλα 1', 9, 22),
  (2, 'Καρέκλα 2', 9, 22),
  (3, 'Καρέκλα 3', 9, 22),
  (4, 'Καρέκλα 4', 9, 22);

-- Add new columns to appointments
ALTER TABLE public.appointments 
  ADD COLUMN chair_id integer REFERENCES public.chairs(id),
  ADD COLUMN service text,
  ADD COLUMN color text DEFAULT '#8B5CF6';

-- Update existing appointments to have a chair_id (distribute them evenly)
UPDATE public.appointments 
SET chair_id = (FLOOR(RANDOM() * 4) + 1)::integer
WHERE chair_id IS NULL;

-- Make chair_id required after data migration
ALTER TABLE public.appointments 
  ALTER COLUMN chair_id SET NOT NULL;

-- Enable RLS on chairs
ALTER TABLE public.chairs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view chairs
CREATE POLICY "Authenticated users can view chairs" 
ON public.chairs 
FOR SELECT 
TO authenticated
USING (true);

-- Allow employees to manage chairs
CREATE POLICY "Only employees can manage chairs" 
ON public.chairs 
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'employee'::app_role));

-- Update the chair availability function to work per chair
CREATE OR REPLACE FUNCTION public.check_chair_availability(
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_chair_id integer,
  p_appointment_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  overlapping_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO overlapping_count
  FROM public.appointments
  WHERE 
    chair_id = p_chair_id
    AND (id != p_appointment_id OR p_appointment_id IS NULL)
    AND (start_time < p_end_time AND end_time > p_start_time);
  
  RETURN overlapping_count = 0;
END;
$$;

-- Update validation trigger
CREATE OR REPLACE FUNCTION public.validate_chair_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT check_chair_availability(NEW.start_time, NEW.end_time, NEW.chair_id, NEW.id) THEN
    RAISE EXCEPTION 'Αυτή η ώρα είναι ήδη κρατημένη για αυτή την καρέκλα.';
  END IF;
  RETURN NEW;
END;
$$;