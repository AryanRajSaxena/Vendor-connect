# Vendor Course Listing Dashboard - Redesign Documentation

## Overview
The vendor course listing dashboard has been completely redesigned to display comprehensive course information. All course data fields are now captured, stored, and displayed in a professional e-commerce style interface.

## Database Changes Required

### SQL Migration
Run the following SQL query on your Supabase database to add the new course fields:

```sql
-- Migration: Add Course-Specific Fields to Products Table
-- This adds fields needed for comprehensive course listing

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
UPDATE products 
SET course_duration = 'Self-paced' 
WHERE course_duration IS NULL;
```

## New Fields & Their Structure

### 1. **Course Duration** (`course_duration`)
- **Type**: VARCHAR(100)
- **Examples**: "4 weeks", "20 hours", "Self-paced", "30 days", "12 weeks"
- **Usage**: Displayed prominently on course cards and detail pages
- **Default**: "Self-paced"

### 2. **Prerequisites** (`prerequisites`)
- **Type**: JSONB Array
- **Structure**: `["Prerequisite 1", "Prerequisite 2", ...]`
- **Example**:
  ```json
  [
    "Basic programming knowledge",
    "Familiarity with JavaScript",
    "Computer with 4GB RAM"
  ]
  ```
- **Max Items**: 10 in form (configurable)

### 3. **Curriculum** (`curriculum`)
- **Type**: JSONB Array of Objects
- **Structure**:
  ```json
  [
    {
      "module": 1,
      "title": "Introduction to Python",
      "lessons": 5,
      "duration": "2 hours"
    },
    {
      "module": 2,
      "title": "Advanced Concepts",
      "lessons": 8,
      "duration": "4 hours"
    }
  ]
  ```
- **Max Modules**: 20 in form (configurable)
- **Fields in Each Module**:
  - `module`: Module number (auto-assigned)
  - `title`: Module/Section name
  - `lessons`: Number of lessons (integer)
  - `duration`: Estimated time (e.g., "2 hours", "1 week")

### 4. **Learning Outcomes** (`learning_outcomes`)
- **Type**: JSONB Array
- **Structure**: `["Outcome 1", "Outcome 2", ...]`
- **Example**:
  ```json
  [
    "Understand core Python concepts",
    "Build real-world projects",
    "Master object-oriented programming",
    "Deploy applications to production"
  ]
  ```
- **Max Items**: 10 in form (configurable)
- **Display Format**: Shown with ✓ checkmarks on customer product pages

## Updated API Endpoints

### POST `/api/products`
Now accepts the following additional fields:

```json
{
  "vendorId": "uuid",
  "name": "string",
  "category": "string",
  "description": "string",
  "basePrice": "number",
  "images": ["url1", "url2"],
  "specifications": { /* existing */ },
  "stock": "number",
  
  // NEW FIELDS:
  "courseDuration": "string",           // e.g., "4 weeks"
  "prerequisites": ["string"],          // Array of prerequisites
  "learningOutcomes": ["string"],       // Array of learning outcomes
  "curriculum": [                       // Array of modules
    {
      "title": "string",
      "lessons": "number",
      "duration": "string"
    }
  ]
}
```

### GET `/api/products`
Returns all course fields including the new ones above.

## Updated Vendor Interface

### 1. **Add Product Form** (`/vendor/add-product`)
The form now includes **8 collapsible sections**:

1. **Basic Information** (expanded by default)
   - Course Name (required)
   - Category (required)
   - Base Price (required)
   - Description (required)

2. **Media & Access**
   - Cover Image URL
   - Course Access / Download Link

3. **Key Highlights**
   - Up to 6 key features
   - Display as bullet points

4. **Course Details**
   - Course Duration (e.g., "4 weeks", "Self-paced")

5. **Prerequisites**
   - Up to 10 prerequisite items
   - Students can check before enrolling

6. **What You'll Learn** (Learning Outcomes)
   - Up to 10 learning outcomes
   - Displayed with ✓ checkmarks

7. **Course Curriculum**
   - Up to 20 modules
   - Each module has:
     - Module Title
     - Number of Lessons
     - Duration

8. **Pricing Preview** (Sidebar)
   - Automatic calculation of final price
   - Commission breakdown
   - Your payout calculation

#### Features:
- ✓ **Collapsible Sections**: Less clutter, better UX
- ✓ **Section Badges**: Show count of items added
- ✓ **Add/Remove Items**: Dynamic arrays for prerequisites, outcomes, curriculum
- ✓ **Pricing Preview**: Real-time calculation on the side
- ✓ **Form Validation**: Ensures only filled items are saved
- ✓ **Professional Styling**: Based on modern e-commerce platforms

### 2. **Courses Listing Dashboard** (`/vendor/products`)
Completely redesigned with two view modes:

#### Grid View (Default)
- 3-column responsive grid
- Each card shows:
  - Course cover image with hover zoom
  - Course category & name
  - Brief description (2 lines)
  - Key stats:
    - Duration with clock icon
    - Number of modules
    - Number of learning outcomes
    - Total enrollments
  - Pricing (your price & customer price)
  - Edit & Delete buttons

#### List View
- Full-width rows with compact info
- Course thumbnail (left)
- Course details (center)
- Statistics & pricing (right)
- Action buttons

#### Shared Features:
- ✓ **Search**: Real-time filter by name or category
- ✓ **Status Badge**: Shows "Live" or "Draft"
- ✓ **View Toggle**: Switch between Grid & List modes
- ✓ **Empty State**: Helpful guidance when no courses
- ✓ **Delete Modal**: Confirmation before deletion
- ✓ **Hover Effects**: Smooth transitions & shadows
- ✓ **Responsive**: Works perfectly on mobile/tablet

#### Stats Displayed:
- 📚 **Course Name** - Prominent title
- 🏷️ **Category** - Course type
- ⏱️ **Duration** - Total time (if set)
- ⚡ **Modules** - Number of curriculum sections (if set)
- 📖 **Learning Outcomes** - Number of outcomes (if set)
- 👥 **Enrollments** - Total students who bought
- 💰 **Pricing** - Your price + customer pays

## File Changes

### Created/Updated Files:
1. **`/src/app/vendor/add-product/page.tsx`** - Completely rewritten
   - Added 8 collapsible form sections
   - Support for all new course fields
   - Form state management for arrays
   - Real-time pricing preview

2. **`/src/app/vendor/products/page.tsx`** - Completely redesigned
   - New card-based grid layout
   - List view option
   - Integrated course statistics
   - Professional dark/light theme support

3. **`/src/app/api/products/route.ts`** - Updated POST endpoint
   - Added new field parameters
   - Stores course data in database

4. **`/COURSE_FIELDS_MIGRATION.sql`** - New SQL migration file
   - Database schema changes
   - Index creation for performance
   - Example data structures

## Key Improvements

✅ **Complete Course Information**: All essential course details captured
✅ **Professional UI**: Modern, clean, e-commerce style design
✅ **Better Organization**: Collapsible sections reduce cognitive load
✅ **Dual View Modes**: Grid for overview, List for quick scanning
✅ **Rich Statistics**: Students can see what they're getting
✅ **Search & Filter**: Find courses quickly
✅ **Responsive Design**: Works on all devices
✅ **Real-time Preview**: Pricing updates as you type
✅ **Data Validation**: Only complete data is saved
✅ **Performance**: Indexed database columns for fast queries

## Migration Steps

1. **Backup your database** (important!)
2. **Run the SQL migration** in Supabase SQL editor
3. **Restart your app** to load new code
4. **Test creating a new course** with all new fields
5. **Check vendor dashboard** to see the new listing interface

## Next Steps

After this database redesign, we can work on:
- Customer product detail page showing all course info
- Customer dashboard for course progress
- Course preview before purchase
- Instructor dashboard with student analytics
- Course reviews and ratings system

## Support for Existing Courses

All existing courses will:
- Keep their current data intact
- Default `course_duration` to "Self-paced"
- Default `prerequisites`, `curriculum`, `learning_outcomes` to empty arrays
- Be fully functional without new fields
- Can be updated anytime by vendors to add new fields

