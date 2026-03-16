-- Migration: Add Course-Specific Fields to Products Table
-- This adds fields needed for comprehensive course listing

-- Add new columns to products table
ALTER TABLE products
ADD COLUMN course_duration VARCHAR(100),  -- e.g., "4 weeks", "12 hours", "30 days"
ADD COLUMN prerequisites JSONB DEFAULT '[]'::jsonb,  -- Array of prerequisite strings
ADD COLUMN curriculum JSONB DEFAULT '[]'::jsonb,  -- Array of modules/sections with details
ADD COLUMN learning_outcomes JSONB DEFAULT '[]'::jsonb;  -- Array of learning outcomes

-- Create indexes for better query performance
CREATE INDEX idx_products_course_duration ON products(course_duration) WHERE course_duration IS NOT NULL;
CREATE INDEX idx_products_curriculum ON products USING GIN(curriculum);
CREATE INDEX idx_products_learning_outcomes ON products USING GIN(learning_outcomes);

-- Update existing products with default course_duration if null
-- (This assumes existing products are courses too)
UPDATE products 
SET course_duration = 'Self-paced' 
WHERE course_duration IS NULL;

-- Add helpful comments
COMMENT ON COLUMN products.course_duration IS 'Duration of the course (e.g., "4 weeks", "20 hours")';
COMMENT ON COLUMN products.prerequisites IS 'JSON array of prerequisite requirements for the course';
COMMENT ON COLUMN products.curriculum IS 'JSON array of curriculum modules/sections with lessons and details';
COMMENT ON COLUMN products.learning_outcomes IS 'JSON array of learning outcomes - what students will learn';

-- Example data structure for curriculum:
-- [
--   {
--     "module": 1,
--     "title": "Introduction",
--     "lessons": 5,
--     "duration": "2 hours"
--   },
--   {
--     "module": 2,
--     "title": "Advanced Topics",
--     "lessons": 8,
--     "duration": "4 hours"
--   }
-- ]

-- Example data structure for learning_outcomes:
-- [
--   "Understand core concepts",
--   "Build real-world projects",
--   "Master advanced techniques"
-- ]

-- Example data structure for prerequisites:
-- [
--   "Basic programming knowledge",
--   "Familiarity with JavaScript",
--   "Computer with 4GB RAM"
-- ]
