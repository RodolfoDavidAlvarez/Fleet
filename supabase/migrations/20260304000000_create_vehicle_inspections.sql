-- Vehicle Inspections: Proactive maintenance system
-- Drivers submit periodic inspection forms. Managers see compliance dashboard.

CREATE TABLE IF NOT EXISTS vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_number TEXT,
  driver_id UUID REFERENCES users(id),
  driver_name TEXT NOT NULL,
  driver_phone TEXT,
  preferred_language TEXT DEFAULT 'en',

  -- Mileage
  current_mileage INTEGER NOT NULL,

  -- Oil / Maintenance
  last_oil_change_date DATE,
  last_oil_change_mileage INTEGER,
  last_maintenance_date DATE,
  last_maintenance_type TEXT,

  -- Condition checks (good | fair | poor | critical)
  tire_condition TEXT NOT NULL DEFAULT 'good' CHECK (tire_condition IN ('good','fair','poor','critical')),
  brake_condition TEXT NOT NULL DEFAULT 'good' CHECK (brake_condition IN ('good','fair','poor','critical')),
  lights_working BOOLEAN DEFAULT true,
  fluid_levels TEXT NOT NULL DEFAULT 'good' CHECK (fluid_levels IN ('good','fair','poor','critical')),
  body_condition TEXT NOT NULL DEFAULT 'good' CHECK (body_condition IN ('good','fair','poor','critical')),

  -- Extras
  warning_lights_on BOOLEAN DEFAULT false,
  warning_lights_description TEXT,
  notes TEXT,
  photo_urls TEXT[] DEFAULT '{}',

  -- Gas fill-up (optional, for mileage tracking at fill-up)
  is_fuel_entry BOOLEAN DEFAULT false,
  fuel_gallons DECIMAL(6,2),

  -- Metadata
  campaign_id UUID,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed','flagged')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inspections_vehicle ON vehicle_inspections(vehicle_id);
CREATE INDEX idx_inspections_driver ON vehicle_inspections(driver_id);
CREATE INDEX idx_inspections_created ON vehicle_inspections(created_at DESC);
CREATE INDEX idx_inspections_status ON vehicle_inspections(status);

-- Inspection campaigns: admin broadcasts an inspection request to all drivers
CREATE TABLE IF NOT EXISTS inspection_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  frequency TEXT DEFAULT 'one_time' CHECK (frequency IN ('one_time','monthly','quarterly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  created_by UUID REFERENCES users(id),
  sms_sent_at TIMESTAMP WITH TIME ZONE,
  total_drivers INTEGER DEFAULT 0,
  submissions_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add campaign_id FK after both tables exist
ALTER TABLE vehicle_inspections
  ADD CONSTRAINT fk_inspection_campaign
  FOREIGN KEY (campaign_id) REFERENCES inspection_campaigns(id);

-- Manager login tracking (lightweight)
CREATE TABLE IF NOT EXISTS manager_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'login', 'view_inspections', 'review_inspection', 'view_dashboard'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_manager_activity_user ON manager_activity_log(user_id);
CREATE INDEX idx_manager_activity_created ON manager_activity_log(created_at DESC);
