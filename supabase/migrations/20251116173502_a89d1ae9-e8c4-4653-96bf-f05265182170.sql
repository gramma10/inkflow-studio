-- Fix search_path for check_chair_availability function
CREATE OR REPLACE FUNCTION check_chair_availability(
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix search_path for validate_chair_availability function
CREATE OR REPLACE FUNCTION validate_chair_availability()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT check_chair_availability(NEW.start_time, NEW.end_time, NEW.id) THEN
    RAISE EXCEPTION 'Δεν υπάρχουν διαθέσιμες καρέκλες για αυτή την ώρα.';
  END IF;
  RETURN NEW;
END;
$$;