-- FB Calculator Tables (Additive Only)

CREATE TABLE IF NOT EXISTS fb_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fb_project_users (
    project_id UUID REFERENCES fb_projects(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    role_scope TEXT NOT NULL,
    PRIMARY KEY (project_id, username)
);

CREATE TABLE IF NOT EXISTS fb_houses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES fb_projects(id) ON DELETE CASCADE,
    house_no TEXT NOT NULL,
    mother_username TEXT,
    UNIQUE(project_id, house_no)
);

CREATE TABLE IF NOT EXISTS fb_rate_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES fb_projects(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL,
    variable_key TEXT NOT NULL,
    value NUMERIC(14,4) NOT NULL,
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    locked BOOLEAN DEFAULT FALSE,
    UNIQUE(project_id, year, month, variable_key)
);

CREATE TABLE IF NOT EXISTS fb_child_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES fb_projects(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL,
    house_id UUID REFERENCES fb_houses(id) ON DELETE CASCADE,
    food_o12 INT DEFAULT 0,
    food_u12 INT DEFAULT 0,
    clothing_o12 INT DEFAULT 0,
    clothing_u12 INT DEFAULT 0,
    household INT DEFAULT 0,
    mother_count INT DEFAULT 0,
    aunt_amount NUMERIC(14,3) DEFAULT 0,
    arrears NUMERIC(14,3) DEFAULT 0,
    festival NUMERIC(14,3) DEFAULT 0,
    adjustment NUMERIC(14,3) DEFAULT 0,
    remarks TEXT,
    UNIQUE(project_id, year, month, house_id)
);

CREATE TABLE IF NOT EXISTS fb_monthly_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES fb_projects(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL,
    totals_json JSONB,
    locked BOOLEAN DEFAULT FALSE,
    locked_by TEXT,
    locked_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(project_id, year, month)
);

CREATE TABLE IF NOT EXISTS fb_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_username TEXT,
    action TEXT NOT NULL,
    project_id UUID,
    month TEXT,
    details_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (allow all for now, enforcement is in JS per requirements)
ALTER TABLE fb_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_rate_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_child_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all public" ON fb_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public" ON fb_project_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public" ON fb_houses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public" ON fb_rate_variables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public" ON fb_child_counts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public" ON fb_monthly_summaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public" ON fb_audit_logs FOR ALL USING (true) WITH CHECK (true);
