-- ============================================================
-- ROSTIFY DATABASE SCHEMA
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- EMPLOYEES
create table employees (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  first_name text not null,
  last_name text not null,
  role text not null,
  pay_rate numeric not null,
  contract_type text default 'Full-time',
  is_active boolean default true,
  site text,
  license_number text,
  license_expiry date,
  clearance_level text default 'None',
  user_id uuid references auth.users(id)
);

-- SITES
create table sites (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  site_name text not null,
  address text,
  client_name text,
  required_guards integer default 1,
  contact_phone text,
  user_id uuid references auth.users(id)
);

-- SHIFTS (Roster)
create table shifts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  employee_id uuid references employees(id) on delete cascade,
  site_id uuid references sites(id),
  day text not null,
  shift_type text not null,
  week_start date not null,
  notes text,
  user_id uuid references auth.users(id)
);

-- CLOCK SESSIONS
create table clock_sessions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  employee_id uuid references employees(id) on delete cascade,
  site_id uuid references sites(id),
  clock_in timestamp with time zone,
  clock_out timestamp with time zone,
  hours_worked numeric,
  gps_location text,
  user_id uuid references auth.users(id)
);

-- INCIDENTS
create table incidents (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  employee_id uuid references employees(id),
  site_id uuid references sites(id),
  description text not null,
  severity text default 'low',
  reported_at timestamp with time zone default now(),
  user_id uuid references auth.users(id)
);

-- PAYROLL RECORDS
create table payroll_records (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  employee_id uuid references employees(id),
  week_start date,
  total_hours numeric,
  gross_pay numeric,
  status text default 'Pending',
  user_id uuid references auth.users(id)
);

-- AUDIT LOG
create table audit_log (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  icon text,
  action text not null,
  type text,
  user_id uuid references auth.users(id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Each user only sees their own data
-- ============================================================

alter table employees enable row level security;
alter table sites enable row level security;
alter table shifts enable row level security;
alter table clock_sessions enable row level security;
alter table incidents enable row level security;
alter table payroll_records enable row level security;
alter table audit_log enable row level security;

-- Policies: users can only access their own data
create policy "Users own employees" on employees for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own sites" on sites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own shifts" on shifts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own clock_sessions" on clock_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own incidents" on incidents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own payroll_records" on payroll_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own audit_log" on audit_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
