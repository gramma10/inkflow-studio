-- Update appointments SELECT policy so employees can only see their own appointments
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;

CREATE POLICY "Admins can view all, employees their own"
ON public.appointments
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    has_role(auth.uid(), 'employee'::app_role) 
    AND artist_id IN (
      SELECT profiles.artist_id 
      FROM profiles 
      WHERE profiles.id = auth.uid()
    )
  )
);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
);