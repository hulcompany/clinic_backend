-- Add consultation_id, session_id, join_enabled, and reminder_sent fields to availability table

ALTER TABLE `availability` 
ADD COLUMN `consultation_id` INT(11) NULL AFTER `status`,
ADD COLUMN `session_id` INT(11) NULL AFTER `consultation_id`,
ADD COLUMN `join_enabled` TINYINT(1) DEFAULT 0 AFTER `session_id`,
ADD COLUMN `reminder_sent` TINYINT(1) DEFAULT 0 AFTER `join_enabled`;

-- Add foreign key constraints
ALTER TABLE `availability` 
ADD CONSTRAINT `fk_availability_consultation` 
FOREIGN KEY (`consultation_id`) 
REFERENCES `consultations`(`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

ALTER TABLE `availability` 
ADD CONSTRAINT `fk_availability_session` 
FOREIGN KEY (`session_id`) 
REFERENCES `sessions`(`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;