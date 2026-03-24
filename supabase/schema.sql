-- =============================================================================
-- FlexCoat Job Card App — Supabase Schema
-- Phase 7: Security hardening — all tables require authentication.
-- =============================================================================

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    customer_name TEXT NOT NULL,
    quote_number TEXT NOT NULL,
    address TEXT NOT NULL,
    date TEXT NOT NULL,
    grand_total DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'invoiced')),
    pdf_url TEXT,
    data JSONB NOT NULL -- Stores the full sections/items structure
);

-- Pricing Defaults Table
CREATE TABLE IF NOT EXISTS pricing_defaults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    default_rate DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initial Pricing Data (Seed)
INSERT INTO pricing_defaults (category, name, unit, default_rate) VALUES
('Internal Wet Areas', 'Shower base (inc. wall/floor joints)', 'qty', 150.00),
('Internal Wet Areas', 'Shower walls (to 2.1m)', 'm2', 85.00),
('Internal Wet Areas', 'Floor area', 'm2', 12.00),
('Internal Wet Areas', 'Wall/floor joints (inc. bond breaker)', 'lm', 8.50),
('Internal Wet Areas', 'Waterstops (inc. glue down)', 'lm', 25.00),
('Internal Wet Areas', 'Primer', 'm2', 5.00);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_defaults ENABLE ROW LEVEL SECURITY;

-- Drop old permissive policies if they exist
DROP POLICY IF EXISTS "Allow public access to jobs" ON jobs;
DROP POLICY IF EXISTS "Allow public read access to pricing" ON pricing_defaults;

-- Jobs: Any authenticated user can read and write jobs
-- (Admin-only actions like delete are also enforced in the API route layer)
CREATE POLICY "Authenticated users can read jobs"
  ON jobs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert jobs"
  ON jobs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update jobs"
  ON jobs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete jobs"
  ON jobs FOR DELETE TO authenticated USING (true);

-- Pricing Defaults: Any authenticated user can read
CREATE POLICY "Authenticated users can read pricing"
  ON pricing_defaults FOR SELECT TO authenticated USING (true);

-- =============================================================================
-- Storage Bucket Policies (run in Supabase Dashboard > Storage > Policies)
-- =============================================================================
-- Make both buckets PRIVATE (not public) in the dashboard, then apply:
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('job-cards', 'job-cards', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('job-photos', 'job-photos', false) ON CONFLICT DO NOTHING;
--
-- CREATE POLICY "Auth upload job-cards"  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'job-cards');
-- CREATE POLICY "Auth read job-cards"    ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'job-cards');
-- CREATE POLICY "Auth delete job-cards"  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'job-cards');
--
-- CREATE POLICY "Auth upload job-photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'job-photos');
-- CREATE POLICY "Auth read job-photos"   ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'job-photos');
-- CREATE POLICY "Auth delete job-photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'job-photos');
