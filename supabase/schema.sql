-- ═══════════════════════════════════════════════════════════════
--  Hospital Management System — Supabase Schema
--  Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Departments ─────────────────────────────────────────────
create table if not exists departments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  head_doctor_id uuid,
  created_at  timestamptz default now()
);

-- ─── Users (Staff + Patients) ────────────────────────────────
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  full_name     text not null,
  phone         text,
  role          text not null default 'PATIENT',
  -- SUPER_ADMIN, ADMIN, DOCTOR, NURSE, RECEPTIONIST, PHARMACIST,
  -- LAB_TECH, ACCOUNTANT, HR_MANAGER, PATIENT
  avatar        text,
  is_active     boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists idx_users_email on users(email);
create index if not exists idx_users_role on users(role);

-- ─── Patients ────────────────────────────────────────────────
create table if not exists patients (
  id              uuid primary key default gen_random_uuid(),
  patient_code    text unique not null,
  user_id         uuid references users(id) on delete set null,
  full_name       text not null,
  email           text,
  phone           text,
  gender          text,
  date_of_birth   date,
  blood_group     text,
  address         text,
  emergency_contact text,
  emergency_phone   text,
  allergies       text,
  status          text default 'ACTIVE',
  registered_by   uuid references users(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists idx_patients_code on patients(patient_code);
create index if not exists idx_patients_name on patients(full_name);

-- ─── Doctors ────────────────────────────────────────────────
create table if not exists doctors (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete cascade,
  doctor_code     text unique not null,
  full_name       text not null,
  specialization  text,
  qualifications  text,
  experience_years integer default 0,
  consultation_fee numeric(10,2) default 0,
  phone           text,
  department_id   uuid references departments(id),
  availability    jsonb default '{"days": ["MON","TUE","WED","THU","FRI"], "hours": "09:00-17:00"}',
  is_available    boolean default true,
  created_at      timestamptz default now()
);
create index if not exists idx_doctors_dept on doctors(department_id);

-- ─── Appointments ───────────────────────────────────────────
create table if not exists appointments (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients(id) on delete cascade,
  doctor_id     uuid not null references doctors(id) on delete cascade,
  department_id uuid references departments(id),
  appointment_date date not null,
  time_slot     text not null,
  status        text default 'SCHEDULED',
  -- SCHEDULED, CONFIRMED, CHECKED_IN, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW
  reason        text,
  notes         text,
  created_by    uuid references users(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_appt_patient on appointments(patient_id);
create index if not exists idx_appt_doctor on appointments(doctor_id);
create index if not exists idx_appt_date on appointments(appointment_date);
create index if not exists idx_appt_status on appointments(status);

-- ─── Wards & Beds ──────────────────────────────────────────
create table if not exists wards (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  type        text,
  -- GENERAL, ICU, PRIVATE, SEMI_PRIVATE, EMERGENCY
  description text,
  created_at  timestamptz default now()
);

create table if not exists beds (
  id          uuid primary key default gen_random_uuid(),
  bed_number  text not null,
  ward_id     uuid not null references wards(id) on delete cascade,
  room_number text,
  status      text default 'AVAILABLE',
  -- AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, CLEANING
  patient_id  uuid references patients(id) on delete set null,
  created_at  timestamptz default now(),
  unique(bed_number, ward_id)
);
create index if not exists idx_beds_ward on beds(ward_id);
create index if not exists idx_beds_status on beds(status);

-- ─── Admissions (IPD) ───────────────────────────────────────
create table if not exists admissions (
  id              uuid primary key default gen_random_uuid(),
  admission_no    text unique not null,
  patient_id      uuid not null references patients(id) on delete cascade,
  doctor_id       uuid references doctors(id),
  bed_id          uuid references beds(id),
  ward_id         uuid references wards(id),
  admission_date  timestamptz default now(),
  discharge_date  timestamptz,
  diagnosis       text,
  status          text default 'ADMITTED',
  -- ADMITTED, DISCHARGED
  discharge_summary text,
  created_by      uuid references users(id),
  created_at      timestamptz default now()
);
create index if not exists idx_admit_patient on admissions(patient_id);

-- ─── Pharmacy (Medicines) ───────────────────────────────────
create table if not exists medicines (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  generic_name  text,
  category      text,
  manufacturer  text,
  batch_no      text,
  expiry_date   date,
  purchase_price numeric(10,2),
  selling_price  numeric(10,2),
  stock_quantity integer default 0,
  min_stock     integer default 10,
  unit          text default 'tablet',
  created_at    timestamptz default now()
);
create index if not exists idx_med_name on medicines(name);
create index if not exists idx_med_stock on medicines(stock_quantity);

-- ─── Prescriptions ──────────────────────────────────────────
create table if not exists prescriptions (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients(id) on delete cascade,
  doctor_id     uuid references doctors(id),
  appointment_id uuid references appointments(id) on delete set null,
  diagnosis     text,
  notes         text,
  status        text default 'ACTIVE',
  -- ACTIVE, DISPENSED, CANCELLED
  created_at    timestamptz default now()
);

create table if not exists prescription_items (
  id              uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  medicine_id     uuid references medicines(id),
  medicine_name   text,
  dosage          text,
  frequency       text,
  duration        text,
  quantity        integer default 1,
  instructions    text
);

-- ─── Laboratory Tests ───────────────────────────────────────
create table if not exists lab_tests (
  id            uuid primary key default gen_random_uuid(),
  test_name     text not null,
  category      text,
  price         numeric(10,2) default 0,
  description   text,
  created_at    timestamptz default now()
);

create table if not exists lab_requests (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients(id) on delete cascade,
  doctor_id     uuid references doctors(id),
  test_id       uuid not null references lab_tests(id),
  status        text default 'REQUESTED',
  -- REQUESTED, SAMPLE_COLLECTED, PROCESSING, COMPLETED, APPROVED
  result        text,
  result_file   text,
  requested_at  timestamptz default now(),
  completed_at  timestamptz
);
create index if not exists idx_labreq_patient on lab_requests(patient_id);

-- ─── Billing ───────────────────────────────────────────────
create table if not exists invoices (
  id            uuid primary key default gen_random_uuid(),
  invoice_no    text unique not null,
  patient_id    uuid not null references patients(id) on delete cascade,
  total_amount  numeric(10,2) default 0,
  discount      numeric(10,2) default 0,
  tax           numeric(10,2) default 0,
  net_amount    numeric(10,2) default 0,
  paid_amount   numeric(10,2) default 0,
  status        text default 'PENDING',
  -- PENDING, PARTIAL, PAID, CANCELLED
  created_at    timestamptz default now()
);
create index if not exists idx_inv_patient on invoices(patient_id);

create table if not exists invoice_items (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references invoices(id) on delete cascade,
  description   text not null,
  category      text,
  -- CONSULTATION, BED, LABORATORY, PHARMACY, RADIOLOGY, OTHER
  quantity      integer default 1,
  unit_price    numeric(10,2),
  total_price   numeric(10,2)
);

-- ─── Payments ───────────────────────────────────────────────
create table if not exists payments (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references invoices(id) on delete cascade,
  patient_id    uuid references patients(id),
  amount        numeric(10,2) not null,
  payment_method text,
  -- CASH, CARD, UPI, BANK_TRANSFER
  transaction_id text,
  created_at    timestamptz default now()
);

-- ─── Notifications ──────────────────────────────────────────
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  title       text not null,
  message     text,
  type        text,
  is_read     boolean default false,
  created_at  timestamptz default now()
);
create index if not exists idx_notif_user on notifications(user_id);

-- ─── Audit Log ──────────────────────────────────────────────
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id),
  action      text,
  entity      text,
  entity_id   text,
  old_value   jsonb,
  new_value   jsonb,
  ip_address  text,
  created_at  timestamptz default now()
);

-- ─── updated_at trigger ─────────────────────────────────────
create or replace function handle_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname='public' and tablename in ('users','patients','appointments','doctors')
  loop
    execute format('drop trigger if exists trg_%I_updated on %I; create trigger trg_%I_updated before update on %I for each row execute function handle_updated_at();', t, t, t, t);
  end loop;
end $$;

-- ─── Insert default departments ─────────────────────────────
insert into departments (name, description) values
  ('Cardiology', 'Heart and cardiovascular care'),
  ('Neurology', 'Nervous system disorders'),
  ('Orthopedics', 'Bone and joint care'),
  ('Pediatrics', 'Child healthcare'),
  ('General Medicine', 'General healthcare'),
  ('Emergency', 'Emergency care'),
  ('Radiology', 'Imaging and diagnostics'),
  ('Laboratory', 'Lab testing and diagnostics'),
  ('Pharmacy', 'Medicine dispensing')
on conflict (name) do nothing;

-- ─── Insert default wards ───────────────────────────────────
insert into wards (name, type) values
  ('General Ward A', 'GENERAL'),
  ('ICU', 'ICU'),
  ('Private Ward 1', 'PRIVATE'),
  ('Emergency Ward', 'EMERGENCY'),
  ('Pediatric Ward', 'GENERAL')
on conflict (name) do nothing;

-- ─── Insert default lab tests ──────────────────────────────
insert into lab_tests (test_name, category, price) values
  ('Complete Blood Count (CBC)', 'Hematology', 250),
  ('Blood Sugar (Fasting)', 'Biochemistry', 100),
  ('Lipid Profile', 'Biochemistry', 400),
  ('Liver Function Test', 'Biochemistry', 500),
  ('Kidney Function Test', 'Biochemistry', 500),
  ('Thyroid Profile (T3, T4, TSH)', 'Endocrinology', 600),
  ('Urine Routine', 'Pathology', 150),
  ('X-Ray Chest', 'Radiology', 350),
  ('ECG', 'Cardiology', 300),
  ('COVID-19 RT-PCR', 'Microbiology', 700)
on conflict do nothing;

-- ─── Insert default medicines ──────────────────────────────
insert into medicines (name, generic_name, category, manufacturer, batch_no, expiry_date, purchase_price, selling_price, stock_quantity, min_stock, unit) values
  ('Paracetamol 500mg', 'Paracetamol', 'Analgesic', 'Cipla', 'BATCH001', '2027-12-31', 2.00, 5.00, 5000, 500, 'tablet'),
  ('Amoxicillin 500mg', 'Amoxicillin', 'Antibiotic', 'Sun Pharma', 'BATCH002', '2027-06-30', 5.00, 12.00, 2000, 300, 'capsule'),
  ('Omeprazole 20mg', 'Omeprazole', 'Antacid', 'Dr. Reddys', 'BATCH003', '2027-08-31', 3.00, 8.00, 1500, 200, 'capsule'),
  ('Metformin 500mg', 'Metformin', 'Antidiabetic', 'USV', 'BATCH004', '2027-03-31', 2.50, 6.00, 3000, 400, 'tablet'),
  ('Aspirin 75mg', 'Aspirin', 'Antiplatelet', 'Bayer', 'BATCH005', '2027-09-30', 1.50, 4.00, 4000, 500, 'tablet'),
  ('Cetirizine 10mg', 'Cetirizine', 'Antihistamine', 'GSK', 'BATCH006', '2027-11-30', 2.00, 5.00, 2500, 300, 'tablet'),
  ('Azithromycin 500mg', 'Azithromycin', 'Antibiotic', 'Pfizer', 'BATCH007', '2027-07-31', 8.00, 20.00, 800, 100, 'tablet'),
  ('Atorvastatin 10mg', 'Atorvastatin', 'Lipid-lowering', 'Lupin', 'BATCH008', '2027-10-31', 4.00, 10.00, 1200, 200, 'tablet'),
  ('Pantoprazole 40mg', 'Pantoprazole', 'Antacid', 'Alkem', 'BATCH009', '2027-05-31', 3.50, 9.00, 1000, 150, 'tablet'),
  ('Ibuprofen 400mg', 'Ibuprofen', 'Analgesic', 'Abbott', 'BATCH010', '2027-12-31', 2.00, 6.00, 3500, 400, 'tablet')
on conflict do nothing;

-- ─── Insert default beds (20 beds) ─────────────────────────
do $$
declare
  w uuid;
  i integer;
begin
  select id into w from wards where name = 'General Ward A' limit 1;
  for i in 1..10 loop
    insert into beds (bed_number, ward_id, room_number, status)
    values ('GWA-' || i, w, 'Room ' || ceil(i/2.0), 'AVAILABLE')
    on conflict (bed_number, ward_id) do nothing;
  end loop;

  select id into w from wards where name = 'ICU' limit 1;
  for i in 1..5 loop
    insert into beds (bed_number, ward_id, room_number, status)
    values ('ICU-' || i, w, 'ICU Room ' || i, 'AVAILABLE')
    on conflict (bed_number, ward_id) do nothing;
  end loop;

  select id into w from wards where name = 'Private Ward 1' limit 1;
  for i in 1..5 loop
    insert into beds (bed_number, ward_id, room_number, status)
    values ('PV1-' || i, w, 'Private Room ' || i, 'AVAILABLE')
    on conflict (bed_number, ward_id) do nothing;
  end loop;
end $$;

-- ─── RLS (Row Level Security) ───────────────────────────────
alter table users enable row level security;
alter table patients enable row level security;
alter table doctors enable row level security;
alter table appointments enable row level security;
alter table beds enable row level security;
alter table admissions enable row level security;
alter table medicines enable row level security;
alter table prescriptions enable row level security;
alter table lab_requests enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;
alter table notifications enable row level security;

-- Allow all for now (production: restrict by auth.uid())
create policy "Public access" on users for all using (true);
create policy "Public access" on patients for all using (true);
create policy "Public access" on doctors for all using (true);
create policy "Public access" on appointments for all using (true);
create policy "Public access" on beds for all using (true);
create policy "Public access" on admissions for all using (true);
create policy "Public access" on medicines for all using (true);
create policy "Public access" on prescriptions for all using (true);
create policy "Public access" on lab_requests for all using (true);
create policy "Public access" on invoices for all using (true);
create policy "Public access" on payments for all using (true);
create policy "Public access" on notifications for all using (true);
