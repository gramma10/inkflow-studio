-- Update the enum to change 'other' to 'admin'
ALTER TYPE app_role RENAME VALUE 'other' TO 'admin';

-- Drop existing appointment policies
DROP POLICY IF EXISTS "Only employees can update appointments" ON appointments;
DROP POLICY IF EXISTS "Only employees can delete appointments" ON appointments;
DROP POLICY IF EXISTS "Only employees can insert appointments" ON appointments;

-- Create new policies: admins can do everything, employees can only manage their own appointments
CREATE POLICY "Admins and employees can insert appointments"
ON appointments
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'employee'::app_role) AND artist_id IN (SELECT artist_id FROM profiles WHERE id = auth.uid()))
);

CREATE POLICY "Admins can update all, employees their own"
ON appointments
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'employee'::app_role) AND artist_id IN (SELECT artist_id FROM profiles WHERE id = auth.uid()))
);

CREATE POLICY "Admins can delete all, employees their own"
ON appointments
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'employee'::app_role) AND artist_id IN (SELECT artist_id FROM profiles WHERE id = auth.uid()))
);