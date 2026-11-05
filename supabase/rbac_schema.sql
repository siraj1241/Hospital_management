-- ═══════════════════════════════════════════════════════════════
--  HMS — Employee Management + Dynamic RBAC + Shifts + Analytics
--  Run AFTER the main schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ─── Designations ───────────────────────────────────────────
create table if not exists designations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  department_id uuid references departments(id) on delete set null,
  created_at  timestamptz default now()
);

-- ─── Roles ──────────────────────────────────────────────────
create table if not exists roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  is_system   boolean default false,
  created_at  timestamptz default now()
);

-- ─── System Modules (pages) ─────────────────────────────────
create table if not exists modules (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  parent_id   uuid references modules(id) on delete cascade,
  icon        text,
  sort_order  integer default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ─── Actions (view, create, edit, delete, etc.) ────────────
create table if not exists actions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  code        text not null unique,
  description text,
  created_at  timestamptz default now()
);

-- ─── Role-Module-Action Permissions ──────────────────────────
create table if not exists role_permissions (
  id          uuid primary key default gen_random_uuid(),
  role_id     uuid not null references roles(id) on delete cascade,
  module_id   uuid not null references modules(id) on delete cascade,
  action_id   uuid references actions(id) on delete cascade,
  is_granted  boolean default true,
  created_at  timestamptz default now(),
  unique(role_id, module_id, action_id)
);

-- ─── Employee-Specific Permission Overrides ─────────────────
create table if not exists employee_permissions (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references users(id) on delete cascade,
  module_id   uuid not null references modules(id) on delete cascade,
  action_id   uuid references actions(id) on delete cascade,
  is_granted  boolean default true,
  created_by  uuid references users(id),
  created_at  timestamptz default now(),
  unique(employee_id, module_id, action_id)
);

-- ─── Permission Change History ──────────────────────────────
create table if not exists permission_changes (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid references users(id) on delete cascade,
  role_id       uuid references roles(id) on delete set null,
  module_id     uuid references modules(id),
  action_id     uuid references actions(id),
  change_type   text,
  -- GRANT, REVOKE, ROLE_ASSIGN, ROLE_REMOVE
  old_value     boolean,
  new_value     boolean,
  changed_by    uuid references users(id),
  reason        text,
  created_at    timestamptz default now()
);

-- ─── Shift Templates ────────────────────────────────────────
create table if not exists shift_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  start_time  text not null,
  end_time    text not null,
  -- '06:00', '14:00', '22:00'
  description text,
  color       text default '#3b82f6',
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ─── Employee Shifts ───────────────────────────────────────
create table if not exists employee_shifts (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references users(id) on delete cascade,
  shift_date      date not null,
  shift_template_id uuid not null references shift_templates(id) on delete cascade,
  department_id   uuid references departments(id),
  ward_id         uuid references wards(id),
  status          text default 'SCHEDULED',
  -- SCHEDULED, COMPLETED, ABSENT, SWAPPED, CANCELLED
  notes           text,
  created_by      uuid references users(id),
  created_at      timestamptz default now(),
  unique(employee_id, shift_date)
);
create index if not exists idx_empshift_emp on employee_shifts(employee_id);
create index if not exists idx_empshift_date on employee_shifts(shift_date);

-- ─── Shift Swap Requests ───────────────────────────────────
create table if not exists shift_swap_requests (
  id              uuid primary key default gen_random_uuid(),
  requester_id    uuid not null references users(id) on delete cascade,
  target_id       uuid not null references users(id) on delete cascade,
  shift_id        uuid not null references employee_shifts(id) on delete cascade,
  target_shift_id uuid references employee_shifts(id) on delete set null,
  status          text default 'PENDING',
  -- PENDING, APPROVED, REJECTED, CANCELLED
  reason          text,
  approved_by     uuid references users(id),
  created_at      timestamptz default now()
);

-- ─── Attendance ────────────────────────────────────────────
create table if not exists attendance (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references users(id) on delete cascade,
  shift_id      uuid references employee_shifts(id) on delete set null,
  date          date not null,
  check_in_time timestamptz,
  check_out_time timestamptz,
  status        text default 'ABSENT',
  -- PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE, HOLIDAY
  late_minutes  integer default 0,
  overtime_minutes integer default 0,
  notes         text,
  created_at    timestamptz default now(),
  unique(employee_id, date)
);
create index if not exists idx_att_emp on attendance(employee_id);
create index if not exists idx_att_date on attendance(date);

-- ─── Leave Types ────────────────────────────────────────────
create table if not exists leave_types (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,
  code            text not null unique,
  max_per_year    integer default 0,
  carry_forward   boolean default false,
  is_paid         boolean default true,
  created_at      timestamptz default now()
);

-- ─── Leave Applications ─────────────────────────────────────
create table if not exists leave_applications (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references users(id) on delete cascade,
  leave_type_id uuid not null references leave_types(id),
  start_date    date not null,
  end_date      date not null,
  days          integer not null,
  reason        text,
  status        text default 'PENDING',
  -- PENDING, APPROVED, REJECTED, CANCELLED
  approved_by   uuid references users(id),
  approved_at   timestamptz,
  manager_comment text,
  created_at    timestamptz default now()
);
create index if not exists idx_leave_emp on leave_applications(employee_id);

-- ─── Leave Balances ────────────────────────────────────────
create table if not exists leave_balances (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references users(id) on delete cascade,
  leave_type_id uuid not null references leave_types(id),
  year          integer not null default extract(year from now()),
  allocated     integer default 0,
  used          integer default 0,
  balance       integer default 0,
  unique(employee_id, leave_type_id, year)
);

-- ─── Employee Profiles (extends users table) ───────────────
alter table users add column if not exists employee_code text;
alter table users add column if not exists department_id uuid references departments(id);
alter table users add column if not exists designation_id uuid references designations(id);
alter table users add column if not exists role_id uuid references roles(id);
alter table users add column if not exists reporting_manager_id uuid references users(id);
alter table users add column if not exists employment_type text default 'FULL_TIME';
alter table users add column if not exists joining_date date;
alter table users add column if not exists profile_photo text;
alter table users add column if not exists is_activated boolean default true;
alter table users add column if not exists last_login_at timestamptz;

create index if not exists idx_users_employee_code on users(employee_code);
create index if not exists idx_users_dept on users(department_id);

-- ─── Seed: Actions ──────────────────────────────────────────
insert into actions (name, code, description) values
  ('View', 'view', 'Can view the page'),
  ('Create', 'create', 'Can create new records'),
  ('Edit', 'edit', 'Can edit existing records'),
  ('Delete', 'delete', 'Can delete records'),
  ('Approve', 'approve', 'Can approve requests'),
  ('Reject', 'reject', 'Can reject requests'),
  ('Export', 'export', 'Can export data'),
  ('Print', 'print', 'Can print documents'),
  ('Download', 'download', 'Can download files'),
  ('Manage', 'manage', 'Full manage access')
on conflict (code) do nothing;

-- ─── Seed: Roles ───────────────────────────────────────────
insert into roles (name, description, is_system) values
  ('Super Admin', 'Full system access', true),
  ('Hospital Administrator', 'Hospital-wide management', true),
  ('HR Manager', 'Human resources management', true),
  ('Doctor', 'Doctor access', true),
  ('Senior Doctor', 'Senior doctor access', true),
  ('Junior Doctor', 'Junior doctor access', true),
  ('Nurse', 'Nursing access', true),
  ('Head Nurse', 'Head nurse access', true),
  ('Receptionist', 'Front desk access', true),
  ('Pharmacist', 'Pharmacy access', true),
  ('Lab Technician', 'Laboratory access', true),
  ('Accountant', 'Billing & finance access', true),
  ('Ward Manager', 'Ward management access', true),
  ('IT Administrator', 'IT & system access', true)
on conflict (name) do nothing;

-- ─── Seed: Modules (hierarchical) ───────────────────────────
insert into modules (name, slug, icon, sort_order) values
  ('Dashboard', 'dashboard', 'LayoutDashboard', 1),
  ('Patient Management', 'patients', 'Users', 2),
  ('Doctor Management', 'doctors', 'Stethoscope', 3),
  ('Appointments', 'appointments', 'Calendar', 4),
  ('Beds & Wards', 'beds', 'BedDouble', 5),
  ('Pharmacy', 'pharmacy', 'Pill', 6),
  ('Laboratory', 'lab', 'FlaskConical', 7),
  ('Billing', 'billing', 'Receipt', 8),
  ('HR Management', 'hr', 'Users', 9),
  ('Employee Management', 'employees', 'UserCog', 10),
  ('Shift Management', 'shifts', 'Clock', 11),
  ('Permission Management', 'permissions', 'Shield', 12),
  ('Management Analytics', 'analytics', 'BarChart3', 13),
  ('Reports', 'reports', 'FileText', 14),
  ('Settings', 'settings', 'Settings', 15)
on conflict (slug) do nothing;

-- ─── Seed: Designations ─────────────────────────────────────
insert into designations (name) values
  ('Chief Medical Officer'),
  ('Senior Consultant'),
  ('Consultant'),
  ('Junior Consultant'),
  ('Staff Nurse'),
  ('Senior Nurse'),
  ('Front Office Executive'),
  ('Pharmacy Manager'),
  ('Lab Manager'),
  ('Billing Executive'),
  ('HR Executive'),
  ('IT Manager'),
  ('Ward Assistant'),
  ('Security Officer')
on conflict (name) do nothing;

-- ─── Seed: Shift Templates ──────────────────────────────────
insert into shift_templates (name, start_time, end_time, description, color) values
  ('Morning Shift', '06:00', '14:00', 'Early morning shift', '#3b82f6'),
  ('General Shift', '09:00', '18:00', 'Standard day shift', '#10b981'),
  ('Evening Shift', '14:00', '22:00', 'Afternoon to evening', '#f59e0b'),
  ('Night Shift', '22:00', '06:00', 'Overnight shift', '#8b5cf6')
on conflict (name) do nothing;

-- ─── Seed: Leave Types ──────────────────────────────────────
insert into leave_types (name, code, max_per_year, carry_forward, is_paid) values
  ('Casual Leave', 'CL', 12, true, true),
  ('Sick Leave', 'SL', 12, true, true),
  ('Annual Leave', 'AL', 20, true, true),
  ('Emergency Leave', 'EL', 5, false, true),
  ('Maternity Leave', 'ML', 90, false, true),
  ('Unpaid Leave', 'UL', 0, false, false)
on conflict (code) do nothing;

-- ─── Seed: Demo Employees ───────────────────────────────────
-- Insert admin user + demo employees
insert into users (email, password_hash, full_name, role, employee_code, department_id, role_id, employment_type, joining_date, is_activated) values
  ('admin@medicore.com', 'admin123', 'System Administrator', 'SUPER_ADMIN', 'EMP-00001', null, (select id from roles where name='Super Admin'), 'FULL_TIME', '2024-01-01', true),
  ('hr@medicore.com', 'hr123', 'HR Manager', 'ADMIN', 'EMP-00002', (select id from departments where name='General Medicine'), (select id from roles where name='HR Manager'), 'FULL_TIME', '2024-03-15', true),
  ('doctor1@medicore.com', 'doc123', 'Dr. Rajesh Kumar', 'DOCTOR', 'EMP-00003', (select id from departments where name='Cardiology'), (select id from roles where name='Senior Doctor'), 'FULL_TIME', '2023-06-01', true),
  ('doctor2@medicore.com', 'doc123', 'Dr. Priya Sharma', 'DOCTOR', 'EMP-00004', (select id from departments where name='Neurology'), (select id from roles where name='Doctor'), 'FULL_TIME', '2024-01-10', true),
  ('nurse1@medicore.com', 'nurse123', 'Nurse Lakshmi', 'NURSE', 'EMP-00005', (select id from departments where name='General Medicine'), (select id from roles where name='Nurse'), 'FULL_TIME', '2024-02-01', true),
  ('pharma@medicore.com', 'pharma123', 'Pharmacist David', 'PHARMACIST', 'EMP-00006', (select id from departments where name='Pharmacy'), (select id from roles where name='Pharmacist'), 'FULL_TIME', '2024-04-20', true),
  ('reception@medicore.com', 'rec123', 'Receptionist Mary', 'RECEPTIONIST', 'EMP-00007', (select id from departments where name='General Medicine'), (select id from roles where name='Receptionist'), 'FULL_TIME', '2024-05-15', true),
  ('lab@medicore.com', 'lab123', 'Lab Tech Ahmed', 'LAB_TECH', 'EMP-00008', (select id from departments where name='Laboratory'), (select id from roles where name='Lab Technician'), 'FULL_TIME', '2024-03-01', true),
  ('accountant@medicore.com', 'acc123', 'Accountant Sunita', 'ACCOUNTANT', 'EMP-00009', (select id from departments where name='General Medicine'), (select id from roles where name='Accountant'), 'FULL_TIME', '2024-02-15', true),
  ('ward@medicore.com', 'ward123', 'Ward Manager Chen', 'ADMIN', 'EMP-00010', (select id from departments where name='General Medicine'), (select id from roles where name='Ward Manager'), 'FULL_TIME', '2024-01-20', true)
on conflict (email) do nothing;

-- ─── Seed: Super Admin Permissions (all modules + all actions) ─
do $$
declare
  r_id uuid;
  m record;
  a record;
begin
  select id into r_id from roles where name = 'Super Admin';
  for m in select id from modules loop
    for a in select id from actions loop
      insert into role_permissions (role_id, module_id, action_id, is_granted)
      values (r_id, m.id, a.id, true)
      on conflict (role_id, module_id, action_id) do nothing;
    end loop;
  end loop;
end $$;

-- ─── Seed: HR Manager Permissions ───────────────────────────
do $$
declare
  r_id uuid;
  m_id uuid;
  a_id uuid;
begin
  select id into r_id from roles where name = 'HR Manager';
  -- HR can view dashboard + manage employees + shifts + attendance + leaves
  for m_id in select id from modules where slug in ('dashboard','hr','employees','shifts','reports') loop
    for a_id in select id from actions loop
      insert into role_permissions (role_id, module_id, action_id, is_granted)
      values (r_id, m_id, a_id, true)
      on conflict do nothing;
    end loop;
  end loop;
end $$;

-- ─── Seed: Doctor Permissions ───────────────────────────────
do $$
declare
  r_id uuid;
  m_id uuid;
  a_id uuid;
begin
  select id into r_id from roles where name = 'Doctor';
  for m_id in select id from modules where slug in ('dashboard','patients','appointments','lab','beds') loop
    for a_id in select id from actions where code in ('view','create','edit') loop
      insert into role_permissions (role_id, module_id, action_id, is_granted)
      values (r_id, m_id, a_id, true)
      on conflict do nothing;
    end loop;
  end loop;
end $$;

-- ─── Seed: Nurse Permissions ────────────────────────────────
do $$
declare
  r_id uuid;
  m_id uuid;
  a_id uuid;
begin
  select id into r_id from roles where name = 'Nurse';
  for m_id in select id from modules where slug in ('dashboard','patients','beds') loop
    for a_id in select id from actions where code in ('view','create','edit') loop
      insert into role_permissions (role_id, module_id, action_id, is_granted)
      values (r_id, m_id, a_id, true)
      on conflict do nothing;
    end loop;
  end loop;
end $$;

-- ─── Seed: Demo Shifts for this week ────────────────────────
do $$
declare
  emp uuid;
  st_morning uuid;
  st_general uuid;
  st_night uuid;
  d date;
  i integer;
begin
  select id into st_morning from shift_templates where name='Morning Shift';
  select id into st_general from shift_templates where name='General Shift';
  select id into st_night from shift_templates where name='Night Shift';

  for i in 0..6 loop
    d := current_date + i;
    -- Doctor on general shift
    select id into emp from users where employee_code='EMP-00003';
    insert into employee_shifts (employee_id, shift_date, shift_template_id, status)
    values (emp, d, st_general, 'SCHEDULED') on conflict do nothing;

    -- Nurse on morning shift
    select id into emp from users where employee_code='EMP-00005';
    insert into employee_shifts (employee_id, shift_date, shift_template_id, status)
    values (emp, d, st_morning, 'SCHEDULED') on conflict do nothing;

    -- Receptionist on general shift
    select id into emp from users where employee_code='EMP-00007';
    insert into employee_shifts (employee_id, shift_date, shift_template_id, status)
    values (emp, d, st_general, 'SCHEDULED') on conflict do nothing;

    -- Pharmacist on evening shift
    select id into emp from users where employee_code='EMP-00006';
    insert into employee_shifts (employee_id, shift_date, shift_template_id, status)
    values (emp, d, st_general, 'SCHEDULED') on conflict do nothing;
  end loop;
end $$;

-- ─── Seed: Demo Attendance (today) ──────────────────────────
do $$
declare
  emp uuid;
begin
  select id into emp from users where employee_code='EMP-00003';
  insert into attendance (employee_id, date, check_in_time, check_out_time, status, late_minutes)
  values (emp, current_date, now() - interval '8 hours', null, 'PRESENT', 0) on conflict do nothing;

  select id into emp from users where employee_code='EMP-00005';
  insert into attendance (employee_id, date, check_in_time, check_out_time, status, late_minutes)
  values (emp, current_date, now() - interval '5 hours', null, 'PRESENT', 0) on conflict do nothing;

  select id into emp from users where employee_code='EMP-00007';
  insert into attendance (employee_id, date, check_in_time, check_out_time, status, late_minutes)
  values (emp, current_date, now() - interval '8 hours', null, 'LATE', 15) on conflict do nothing;
end $$;

-- ─── RLS ────────────────────────────────────────────────────
alter table roles enable row level security;
alter table modules enable row level security;
alter table actions enable row level security;
alter table role_permissions enable row level security;
alter table employee_permissions enable row level security;
alter table permission_changes enable row level security;
alter table shift_templates enable row level security;
alter table employee_shifts enable row level security;
alter table shift_swap_requests enable row level security;
alter table attendance enable row level security;
alter table leave_types enable row level security;
alter table leave_applications enable row level security;
alter table leave_balances enable row level security;
alter table designations enable row level security;

create policy "Public" on roles for all using (true);
create policy "Public" on modules for all using (true);
create policy "Public" on actions for all using (true);
create policy "Public" on role_permissions for all using (true);
create policy "Public" on employee_permissions for all using (true);
create policy "Public" on permission_changes for all using (true);
create policy "Public" on shift_templates for all using (true);
create policy "Public" on employee_shifts for all using (true);
create policy "Public" on shift_swap_requests for all using (true);
create policy "Public" on attendance for all using (true);
create policy "Public" on leave_types for all using (true);
create policy "Public" on leave_applications for all using (true);
create policy "Public" on leave_balances for all using (true);
create policy "Public" on designations for all using (true);
