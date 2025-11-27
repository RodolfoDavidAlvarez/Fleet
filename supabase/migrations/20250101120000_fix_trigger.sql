
-- Fix Trigger to avoid updating all rows (violates safety policy)
CREATE OR REPLACE FUNCTION update_department_vehicle_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update count for the new department
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.department IS NOT NULL THEN
      UPDATE departments 
      SET vehicle_count = (
        SELECT COUNT(*) FROM vehicles WHERE department = NEW.department
      )
      WHERE name = NEW.department;
    END IF;
  END IF;

  -- Update count for the old department if it changed
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF OLD.department IS NOT NULL AND (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.department != NEW.department)) THEN
      UPDATE departments 
      SET vehicle_count = (
        SELECT COUNT(*) FROM vehicles WHERE department = OLD.department
      )
      WHERE name = OLD.department;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with the fixed function
DROP TRIGGER IF EXISTS update_dept_counts_on_vehicle_change ON vehicles;
CREATE TRIGGER update_dept_counts_on_vehicle_change
  AFTER INSERT OR UPDATE OR DELETE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_department_vehicle_counts();
