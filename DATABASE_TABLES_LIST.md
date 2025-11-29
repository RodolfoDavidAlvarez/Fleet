# Database Tables List

Based on the schema analysis, here are all the tables needed for the Fleet Management System:

## Core Tables

### 1. **users**
- Primary user accounts for all system users
- Fields: id, email, name, role (admin, mechanic, customer, driver), phone, password_hash, created_at
- Purpose: Authentication and user management

### 2. **vehicles**
- Vehicle inventory and information
- Fields: id, make, model, year, vin, license_plate, status, last_service_date, next_service_due, mileage, driver_id, created_at
- Purpose: Track all fleet vehicles

### 3. **vehicle_drivers**
- Many-to-many relationship between vehicles and drivers
- Fields: id, vehicle_id, driver_id, is_primary, assigned_date, notes, created_at
- Purpose: Support multiple drivers per vehicle with primary driver designation

## Service & Maintenance Tables

### 4. **service_records**
- Historical service records for vehicles
- Fields: id, vehicle_id, date, service_type, description, cost, mechanic_id, created_at
- Purpose: Track all service history

### 5. **parts**
- Parts used in service records
- Fields: id, service_record_id, name, quantity, cost, created_at
- Purpose: Track parts inventory and usage in services

### 6. **mechanics**
- Mechanic profiles (extends users)
- Fields: id, user_id, name, email, phone, specializations, availability, created_at
- Purpose: Manage mechanic information and availability (Note: Only 2 mechanics exist, rest are drivers)

## Booking & Job Tables

### 7. **bookings**
- Customer service bookings/appointments
- Fields: id, vehicle_id, customer_name, customer_email, customer_phone, service_type, scheduled_date, scheduled_time, status, mechanic_id, vehicle_info, sms_consent, compliance_accepted, notes, created_at, updated_at
- Purpose: Manage customer bookings

### 8. **jobs**
- Work orders assigned to mechanics
- Fields: id, booking_id, vehicle_id, mechanic_id, status, priority, start_time, end_time, estimated_hours, actual_hours, labor_cost, total_cost, notes, created_at, updated_at
- Purpose: Track job assignments and progress

### 9. **job_parts**
- Parts used in jobs (item details)
- Fields: id, job_id, name, quantity, cost, created_at
- Purpose: Track parts/items used in each job with quantities and costs

## Views & Functions

### Views:
- **vehicles_with_drivers**: Combined view of vehicles with driver information

### Functions:
- **get_vehicle_driver_phone**: Get primary driver phone for a vehicle
- **assign_driver_to_vehicle**: Assign driver to vehicle
- **update_updated_at_column**: Auto-update timestamp trigger

## Summary

**Total Tables: 9**
- 3 Core tables (users, vehicles, vehicle_drivers)
- 3 Service tables (service_records, parts, mechanics)
- 3 Booking/Job tables (bookings, jobs, job_parts)

**Key Notes:**
- `job_parts` is the **item details** table for tracking parts/items used in jobs
- `parts` table tracks parts used in historical service records
- `mechanics` table only has 2 entries (the rest are drivers in the `users` table with role='driver')
- `vehicle_drivers` supports many-to-many relationships for multiple drivers per vehicle





