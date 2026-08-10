/*
# Create training modules and progress tables (single-tenant, no auth)

1. New Tables
- `modules`: a training catalog of videos and documents, organized by section.
  - `id` (uuid, primary key)
  - `section` (text, e.g. "Onboarding", "Safety") used to group modules in the sidebar
  - `title` (text)
  - `description` (text)
  - `type` (text): 'video' or 'document'
  - `content_url` (text): the embeddable URL for a video, or the readable URL for a document
  - `duration_minutes` (int): estimated time to complete
  - `order_index` (int): ordering within a section
  - `created_at` (timestamp)
- `progress`: one row per module per tracked viewer (single-tenant so no user_id).
  - `id` (uuid, primary key)
  - `module_id` (uuid, references modules, cascade delete)
  - `status` (text): 'not_started' | 'in_progress' | 'completed'
  - `completed_at` (timestamp, nullable)
  - `last_viewed_at` (timestamp, nullable)
  - `updated_at` (timestamp)
  - UNIQUE constraint on module_id so there is exactly one progress row per module
2. Security
- Enable RLS on both tables.
- Allow anon + authenticated CRUD because this is an intentionally single-tenant app with no sign-in.
3. Notes
- Seed data is inserted in a second migration so the catalog is populated with sample training content.
*/

CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL CHECK (type IN ('video', 'document')),
  content_url text NOT NULL DEFAULT '',
  duration_minutes int NOT NULL DEFAULT 5,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_modules" ON modules;
CREATE POLICY "anon_select_modules" ON modules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_modules" ON modules;
CREATE POLICY "anon_insert_modules" ON modules FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_modules" ON modules;
CREATE POLICY "anon_update_modules" ON modules FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_modules" ON modules;
CREATE POLICY "anon_delete_modules" ON modules FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  last_viewed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (module_id)
);

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_progress" ON progress;
CREATE POLICY "anon_select_progress" ON progress FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_progress" ON progress;
CREATE POLICY "anon_insert_progress" ON progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_progress" ON progress;
CREATE POLICY "anon_update_progress" ON progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_progress" ON progress;
CREATE POLICY "anon_delete_progress" ON progress FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_modules_section_order ON modules (section, order_index);
CREATE INDEX IF NOT EXISTS idx_progress_module_id ON progress (module_id);
