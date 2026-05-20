-- ADD_SERVICE_DISCOUNTS_PATCH.sql
-- Run this script to add discount functionality to the services table

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0;

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMP WITH TIME ZONE;
