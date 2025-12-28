-- Migration to add doctor_id column to admins table for secretary-doctor relationship
ALTER TABLE admins 
ADD COLUMN doctor_id INT NULL COMMENT 'Foreign key to reference the doctor this secretary is associated with',
ADD CONSTRAINT fk_admin_doctor 
FOREIGN KEY (doctor_id) REFERENCES admins(user_id) 
ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_admin_doctor ON admins(doctor_id);

-- Update the check constraint to allow doctor_id for secretaries
-- We'll update existing records to ensure data consistency
UPDATE admins 
SET doctor_id = NULL 
WHERE role = 'doctor';

-- For secretaries, you would need to assign them to doctors separately