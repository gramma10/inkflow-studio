-- Create artists table
CREATE TABLE public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  price DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Public access policies (no authentication needed for internal use)
CREATE POLICY "Allow all access to artists" ON public.artists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);

-- Function to check chair availability (max 4 concurrent appointments)
CREATE OR REPLACE FUNCTION check_chair_availability(
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  overlapping_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO overlapping_count
  FROM public.appointments
  WHERE 
    (id != p_appointment_id OR p_appointment_id IS NULL)
    AND (
      (start_time < p_end_time AND end_time > p_start_time)
    );
  
  RETURN overlapping_count < 4;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to validate chair availability before insert/update
CREATE OR REPLACE FUNCTION validate_chair_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_chair_availability(NEW.start_time, NEW.end_time, NEW.id) THEN
    RAISE EXCEPTION 'Δεν υπάρχουν διαθέσιμες καρέκλες για αυτή την ώρα.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to appointments table
CREATE TRIGGER check_chairs_before_insert_update
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_chair_availability();

-- Insert default artists
INSERT INTO public.artists (name) VALUES 
  ('Καλλιτέχνης 1'),
  ('Καλλιτέχνης 2'),
  ('Καλλιτέχνης 3'),
  ('Καλλιτέχνης 4');