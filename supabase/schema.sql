-- SQL Schema for Flexcoat Job Card App

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

-- Enable Row Level Security (RLS)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_defaults ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for MVP (adjust for production)
CREATE POLICY "Allow public read access to pricing" ON pricing_defaults FOR SELECT USING (true);
CREATE POLICY "Allow public access to jobs" ON jobs FOR ALL USING (true);
