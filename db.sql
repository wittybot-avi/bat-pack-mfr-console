-- ============================================================
-- Aayatana Battery Pack Manufacturer Microservice
-- Postgres DDL Migration (v1.0) — enums + constraints + indexes
-- ============================================================

-- Recommended extensions
create extension if not exists pgcrypto;  -- gen_random_uuid()
create extension if not exists citext;    -- case-insensitive email

-- ------------------------------------------------------------
-- 0) Utility: updated_at trigger
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- 1) ENUMS
-- ------------------------------------------------------------
do $$ begin
  create type user_status_t as enum ('ACTIVE','DISABLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type station_type_t as enum ('PROVISIONING','EOL_QA','CALIBRATION');
exception when duplicate_object then null; end $$;

do $$ begin
  create type station_status_t as enum ('ACTIVE','INACTIVE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type profile_kind_t as enum ('PROVISIONING','EOL_QA');
exception when duplicate_object then null; end $$;

do $$ begin
  create type batch_status_t as enum ('OPEN','CLOSED','CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type prov_session_status_t as enum ('CREATED','STARTED','COMPLETED','FAILED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pass_fail_t as enum ('PASS','FAIL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type qa_run_status_t as enum ('CREATED','COMPLETED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inventory_reason_t as enum (
    'PUTAWAY','MOVE','QUARANTINE','RELEASE','RESERVE','UNRESERVE','PICK'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type inventory_ref_type_t as enum ('DISPATCH','QA','WARRANTY','ADHOC');
exception when duplicate_object then null; end $$;

do $$ begin
  create type dispatch_status_t as enum ('DRAFT','READY','DISPATCHED','CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type custody_event_t as enum ('DISPATCHED','RECEIVED','ACCEPTED','REJECTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type custody_status_t as enum ('AT_FACTORY','IN_TRANSIT','RECEIVED','ACCEPTED','REJECTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inventory_status_t as enum ('IN_STOCK','RESERVED','QUARANTINED','IN_TRANSIT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type provisioning_status_t as enum ('NOT_STARTED','IN_PROGRESS','PASS','FAIL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type eol_status_t as enum ('NOT_STARTED','PASS','FAIL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type warranty_status_t as enum ('NONE','OPEN','DECIDED','CLOSED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type location_type_t as enum ('RACK','QUARANTINE','DOCK','YARD','CUSTOMER_SITE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type customer_type_t as enum ('OEM','FLEET','DISTRIBUTOR');
exception when duplicate_object then null; end $$;

do $$ begin
  create type finding_type_t as enum ('PROCESS','QUALITY','TRACEABILITY','DATA_INTEGRITY');
exception when duplicate_object then null; end $$;

do $$ begin
  create type severity_t as enum ('LOW','MED','HIGH','CRITICAL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type finding_status_t as enum ('OPEN','IN_REVIEW','CLOSED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type warranty_claim_status_t as enum ('OPEN','UNDER_ANALYSIS','AWAITING_EVIDENCE','DECIDED','CLOSED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type warranty_priority_t as enum ('LOW','MED','HIGH','CRITICAL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type failure_category_t as enum (
    'MANUFACTURING_DEFECT','QA_ESCAPE','LOGISTICS_DAMAGE','FIELD_MISUSE','AGING_WEAR','UNKNOWN'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type warranty_event_t as enum ('CREATED','EVIDENCE_REQUESTED','EVIDENCE_ADDED','DECIDED','CLOSED','COMMENT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type file_purpose_t as enum ('WARRANTY_EVIDENCE','CUSTODY_EVIDENCE','COMPLIANCE_EVIDENCE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type linked_type_t as enum ('battery','batch','dispatch','claim');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- 2) TENANCY + ACCESS CONTROL
-- ------------------------------------------------------------
create table if not exists orgs (
  org_id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists plants (
  plant_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  name text not null,
  location text,
  created_at timestamptz not null default now()
);
create index if not exists idx_plants_org on plants(org_id);

create table if not exists users (
  user_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  email citext not null,
  name text not null,
  status user_status_t not null default 'ACTIVE',
  created_at timestamptz not null default now()
);
create unique index if not exists uq_users_email on users(email);
create index if not exists idx_users_org on users(org_id);

create table if not exists role_clusters (
  role_id text primary key, -- e.g. C1_LEADERSHIP, C9_EXTERNAL, SUPER
  label text not null,
  description text
);

create table if not exists user_roles (
  user_id uuid not null references users(user_id) on delete cascade,
  role_id text not null references role_clusters(role_id) on delete restrict,
  scope_plant_id uuid references plants(plant_id) on delete cascade,
  scope_customer_id uuid, -- will FK after customers exist
  created_at timestamptz not null default now(),
  primary key (user_id, role_id, scope_plant_id, scope_customer_id)
);
create index if not exists idx_user_roles_user on user_roles(user_id);
create index if not exists idx_user_roles_role on user_roles(role_id);

-- Optional RBAC policy storage
create table if not exists rbac_screen_ids (
  screen_id text primary key,
  label text not null,
  group_name text not null -- OBSERVE/OPERATE/GOVERN/RESOLVE/ADMIN
);

create table if not exists rbac_policy_versions (
  policy_version uuid primary key default gen_random_uuid(),
  published_at timestamptz not null default now(),
  published_by uuid references users(user_id)
);

create table if not exists rbac_grants (
  policy_version uuid not null references rbac_policy_versions(policy_version) on delete cascade,
  role_id text not null references role_clusters(role_id) on delete restrict,
  screen_id text not null references rbac_screen_ids(screen_id) on delete restrict,
  actions_json jsonb not null default '[]'::jsonb,
  primary key (policy_version, role_id, screen_id)
);
create index if not exists idx_rbac_grants_role on rbac_grants(role_id);

-- ------------------------------------------------------------
-- 3) MASTER DATA
-- ------------------------------------------------------------
create table if not exists customers (
  customer_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  name text not null,
  type customer_type_t not null,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_customers_org on customers(org_id);

-- Backfill FK now that customers exist
do $$ begin
  alter table user_roles
    add constraint fk_user_roles_customer
    foreign key (scope_customer_id) references customers(customer_id) on delete cascade;
exception when duplicate_object then null; end $$;

create table if not exists locations (
  location_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  plant_id uuid references plants(plant_id) on delete cascade,
  type location_type_t not null,
  name text not null,
  geo_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_locations_org on locations(org_id);
create index if not exists idx_locations_plant on locations(plant_id);

create table if not exists variants (
  variant_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  code text not null,
  name text not null,
  attrs_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, code)
);
create index if not exists idx_variants_org on variants(org_id);
create trigger trg_variants_updated_at
before update on variants for each row execute function set_updated_at();

create table if not exists stations (
  station_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  plant_id uuid not null references plants(plant_id) on delete cascade,
  name text not null,
  type station_type_t not null,
  status station_status_t not null default 'ACTIVE',
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, plant_id, name)
);
create index if not exists idx_stations_org on stations(org_id);
create index if not exists idx_stations_plant on stations(plant_id);
create index if not exists idx_stations_type on stations(type);
create trigger trg_stations_updated_at
before update on stations for each row execute function set_updated_at();

create table if not exists profiles (
  profile_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  kind profile_kind_t not null,
  name text not null,
  version text not null,
  is_active boolean not null default true,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, kind, name, version)
);
create index if not exists idx_profiles_org on profiles(org_id);
create index if not exists idx_profiles_kind on profiles(kind);
create index if not exists idx_profiles_active on profiles(is_active);
create trigger trg_profiles_updated_at
before update on profiles for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- 4) MANUFACTURING CORE
-- ------------------------------------------------------------
create table if not exists batches (
  batch_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  plant_id uuid not null references plants(plant_id) on delete cascade,
  batch_code text not null,
  variant_id uuid not null references variants(variant_id) on delete restrict,
  planned_qty int not null check (planned_qty > 0),
  status batch_status_t not null default 'OPEN',
  created_by uuid references users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (org_id, batch_code)
);
create index if not exists idx_batches_org on batches(org_id);
create index if not exists idx_batches_plant on batches(plant_id);
create index if not exists idx_batches_status on batches(status);
create index if not exists idx_batches_variant on batches(variant_id);
create trigger trg_batches_updated_at
before update on batches for each row execute function set_updated_at();

create table if not exists batteries (
  battery_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  plant_id uuid not null references plants(plant_id) on delete cascade,
  batch_id uuid not null references batches(batch_id) on delete restrict,
  variant_id uuid not null references variants(variant_id) on delete restrict,
  serial text not null,
  qr_code text,
  created_at timestamptz not null default now(),

  -- fast read-model fields (derived)
  provisioning_status provisioning_status_t not null default 'NOT_STARTED',
  eol_status eol_status_t not null default 'NOT_STARTED',
  inventory_status inventory_status_t not null default 'IN_STOCK',
  custody_status custody_status_t not null default 'AT_FACTORY',
  current_location_id uuid references locations(location_id) on delete set null,
  current_dispatch_id uuid, -- FK added after dispatch table
  warranty_status warranty_status_t not null default 'NONE',

  updated_at timestamptz not null default now(),
  unique (org_id, serial)
);
create index if not exists idx_batteries_org on batteries(org_id);
create index if not exists idx_batteries_batch on batteries(batch_id);
create index if not exists idx_batteries_variant on batteries(variant_id);
create index if not exists idx_batteries_statuses on batteries(provisioning_status, eol_status, inventory_status, custody_status);
create index if not exists idx_batteries_location on batteries(current_location_id);
create trigger trg_batteries_updated_at
before update on batteries for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- 5) PROVISIONING
-- ------------------------------------------------------------
create table if not exists provisioning_sessions (
  session_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  station_id uuid not null references stations(station_id) on delete restrict,
  battery_id uuid not null references batteries(battery_id) on delete restrict,
  profile_id uuid not null references profiles(profile_id) on delete restrict,
  status prov_session_status_t not null default 'CREATED',
  result pass_fail_t,
  firmware_version text,
  calibration_ref text,
  notes text,
  created_by uuid references users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);
create index if not exists idx_prov_sessions_battery on provisioning_sessions(battery_id, completed_at desc);
create index if not exists idx_prov_sessions_station on provisioning_sessions(station_id, created_at desc);
create index if not exists idx_prov_sessions_status on provisioning_sessions(status);

-- Optional step trace
create table if not exists provisioning_steps (
  step_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references provisioning_sessions(session_id) on delete cascade,
  name text not null,
  status text not null,
  started_at timestamptz,
  ended_at timestamptz,
  data_json jsonb not null default '{}'::jsonb
);
create index if not exists idx_prov_steps_session on provisioning_steps(session_id);

-- ------------------------------------------------------------
-- 6) EOL / QA
-- ------------------------------------------------------------
create table if not exists qa_runs (
  run_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  station_id uuid not null references stations(station_id) on delete restrict,
  battery_id uuid not null references batteries(battery_id) on delete restrict,
  profile_id uuid not null references profiles(profile_id) on delete restrict,
  status qa_run_status_t not null default 'CREATED',
  result pass_fail_t,
  certificate_ref text,
  measurements_json jsonb not null default '{}'::jsonb,
  created_by uuid references users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists idx_qa_runs_battery on qa_runs(battery_id, completed_at desc);
create index if not exists idx_qa_runs_station on qa_runs(station_id, created_at desc);
create index if not exists idx_qa_runs_status on qa_runs(status);

create table if not exists qa_measurements (
  run_id uuid not null references qa_runs(run_id) on delete cascade,
  metric_code text not null,
  value_num double precision,
  value_text text,
  unit text,
  primary key (run_id, metric_code)
);
create index if not exists idx_qa_measurements_metric on qa_measurements(metric_code);

-- ------------------------------------------------------------
-- 7) INVENTORY (append-only movements)
-- ------------------------------------------------------------
create table if not exists inventory_movements (
  movement_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  battery_id uuid not null references batteries(battery_id) on delete restrict,
  from_location_id uuid references locations(location_id) on delete set null,
  to_location_id uuid references locations(location_id) on delete set null,
  reason inventory_reason_t not null,
  reference_type inventory_ref_type_t not null default 'ADHOC',
  reference_id uuid,
  actor_user_id uuid references users(user_id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_inventory_moves_battery on inventory_movements(battery_id, created_at desc);
create index if not exists idx_inventory_moves_to on inventory_movements(to_location_id, created_at desc);
create index if not exists idx_inventory_moves_reason on inventory_movements(reason);

create table if not exists inventory_reservations (
  reservation_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  battery_id uuid not null references batteries(battery_id) on delete restrict,
  reservation_ref text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','RELEASED')),
  created_at timestamptz not null default now(),
  released_at timestamptz,
  unique (org_id, reservation_ref, battery_id)
);
create index if not exists idx_inventory_res_battery on inventory_reservations(battery_id, status);

-- ------------------------------------------------------------
-- 8) DISPATCH
-- ------------------------------------------------------------
create table if not exists dispatch_orders (
  dispatch_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  plant_id uuid not null references plants(plant_id) on delete cascade,
  customer_id uuid not null references customers(customer_id) on delete restrict,
  destination_location_id uuid not null references locations(location_id) on delete restrict,
  carrier_name text,
  status dispatch_status_t not null default 'DRAFT',
  ship_date timestamptz,
  tracking_ref text,
  created_by uuid references users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_dispatch_org on dispatch_orders(org_id);
create index if not exists idx_dispatch_plant on dispatch_orders(plant_id);
create index if not exists idx_dispatch_customer on dispatch_orders(customer_id);
create index if not exists idx_dispatch_status on dispatch_orders(status);
create trigger trg_dispatch_updated_at
before update on dispatch_orders for each row execute function set_updated_at();

create table if not exists dispatch_items (
  dispatch_id uuid not null references dispatch_orders(dispatch_id) on delete cascade,
  battery_id uuid not null references batteries(battery_id) on delete restrict,
  added_at timestamptz not null default now(),
  primary key (dispatch_id, battery_id)
);
create index if not exists idx_dispatch_items_battery on dispatch_items(battery_id);

-- Add FK batteries.current_dispatch_id now
do $$ begin
  alter table batteries
    add constraint fk_batteries_current_dispatch
    foreign key (current_dispatch_id) references dispatch_orders(dispatch_id) on delete set null;
exception when duplicate_object then null; end $$;
create index if not exists idx_batteries_dispatch on batteries(current_dispatch_id);

-- ------------------------------------------------------------
-- 9) CUSTODY (append-only events)
-- ------------------------------------------------------------
create table if not exists custody_events (
  event_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  dispatch_id uuid not null references dispatch_orders(dispatch_id) on delete cascade,
  event_type custody_event_t not null,
  actor_user_id uuid references users(user_id) on delete set null,
  actor_role text not null,
  location_text text,
  reason_code text,
  notes text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_custody_events_dispatch on custody_events(dispatch_id, created_at desc);
create index if not exists idx_custody_events_type on custody_events(event_type);

-- Optional read model per dispatch
create table if not exists custody_state (
  dispatch_id uuid primary key references dispatch_orders(dispatch_id) on delete cascade,
  status custody_status_t not null default 'IN_TRANSIT',
  last_event_at timestamptz
);

-- ------------------------------------------------------------
-- 10) WARRANTY
-- ------------------------------------------------------------
create table if not exists warranty_claims (
  claim_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  battery_id uuid not null references batteries(battery_id) on delete restrict,
  customer_id uuid not null references customers(customer_id) on delete restrict,
  status warranty_claim_status_t not null default 'OPEN',
  priority warranty_priority_t not null default 'MED',
  failure_category failure_category_t not null,
  symptoms_text text not null,
  assigned_to uuid references users(user_id) on delete set null,
  rca_json jsonb not null default '{}'::jsonb,
  decision_json jsonb,
  created_by uuid references users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  closure_notes text
);
create index if not exists idx_warranty_battery on warranty_claims(battery_id, created_at desc);
create index if not exists idx_warranty_status on warranty_claims(status);
create index if not exists idx_warranty_customer on warranty_claims(customer_id);
create trigger trg_warranty_updated_at
before update on warranty_claims for each row execute function set_updated_at();

create table if not exists warranty_events (
  event_id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references warranty_claims(claim_id) on delete cascade,
  event_type warranty_event_t not null,
  payload_json jsonb not null default '{}'::jsonb,
  actor_user_id uuid references users(user_id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_warranty_events_claim on warranty_events(claim_id, created_at desc);

-- ------------------------------------------------------------
-- 11) COMPLIANCE + EVIDENCE
-- ------------------------------------------------------------
create table if not exists compliance_findings (
  finding_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  title text not null,
  type finding_type_t not null,
  severity severity_t not null,
  status finding_status_t not null default 'OPEN',
  linked_type linked_type_t not null,
  linked_id uuid not null,
  notes text,
  created_by uuid references users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_findings_link on compliance_findings(linked_type, linked_id);
create index if not exists idx_findings_status on compliance_findings(status);
create index if not exists idx_findings_severity on compliance_findings(severity);
create trigger trg_findings_updated_at
before update on compliance_findings for each row execute function set_updated_at();

create table if not exists evidence_packs (
  pack_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  scope linked_type_t not null,
  scope_id uuid not null,
  format text not null default 'json' check (format in ('json','pdf')),
  generated_by uuid references users(user_id) on delete set null,
  payload_json jsonb,
  file_id uuid, -- FK after files table
  created_at timestamptz not null default now()
);
create index if not exists idx_evidence_scope on evidence_packs(scope, scope_id);

-- ------------------------------------------------------------
-- 12) FILES + ATTACHMENTS
-- ------------------------------------------------------------
create table if not exists files (
  file_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  purpose file_purpose_t not null,
  file_name text not null,
  mime_type text not null,
  storage_key text not null,
  size_bytes bigint,
  created_by uuid references users(user_id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_files_org on files(org_id);
create index if not exists idx_files_purpose on files(purpose);

-- Add FK evidence_packs.file_id now
do $$ begin
  alter table evidence_packs
    add constraint fk_evidence_file
    foreign key (file_id) references files(file_id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists entity_attachments (
  entity_type text not null check (entity_type in ('claim','custody_event','finding')),
  entity_id uuid not null,
  file_id uuid not null references files(file_id) on delete cascade,
  attached_at timestamptz not null default now(),
  primary key (entity_type, entity_id, file_id)
);
create index if not exists idx_entity_attachments_entity on entity_attachments(entity_type, entity_id);

-- ------------------------------------------------------------
-- 13) TELEMETRY (lightweight caches; keep raw telemetry in TSDB)
-- ------------------------------------------------------------
create table if not exists telemetry_latest (
  org_id uuid not null references orgs(org_id) on delete cascade,
  battery_id uuid not null references batteries(battery_id) on delete cascade,
  last_seen_at timestamptz not null,
  soc double precision,
  soh double precision,
  voltage double precision,
  current double precision,
  temp_c double precision,
  payload_json jsonb not null default '{}'::jsonb,
  primary key (org_id, battery_id)
);
create index if not exists idx_telemetry_latest_last_seen on telemetry_latest(last_seen_at desc);

create table if not exists telemetry_summary_daily (
  org_id uuid not null references orgs(org_id) on delete cascade,
  battery_id uuid not null references batteries(battery_id) on delete cascade,
  day date not null,
  summary_json jsonb not null,
  primary key (org_id, battery_id, day)
);

-- ------------------------------------------------------------
-- 14) AUDIT LOG (append-only)
-- ------------------------------------------------------------
create table if not exists audit_log (
  audit_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(org_id) on delete cascade,
  actor_user_id uuid references users(user_id) on delete set null,
  actor_role text,
  action text not null,
  entity_type text,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  request_id text,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_org on audit_log(org_id, created_at desc);
create index if not exists idx_audit_entity on audit_log(entity_type, entity_id);
create index if not exists idx_audit_action on audit_log(action);

-- ------------------------------------------------------------
-- 15) SAFETY CHECKS (recommended constraints)
-- ------------------------------------------------------------

-- Prevent creating batteries under CLOSED/CANCELLED batches (soft enforced in app, but add DB guard via trigger)
create or replace function enforce_batch_open_for_battery()
returns trigger as $$
declare b_status batch_status_t;
begin
  select status into b_status from batches where batch_id = new.batch_id;
  if b_status <> 'OPEN' then
    raise exception 'Cannot create/update battery under batch with status %', b_status;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_batteries_batch_open on batteries;
create trigger trg_batteries_batch_open
before insert or update of batch_id on batteries
for each row execute function enforce_batch_open_for_battery();

-- Ensure dispatch items are unique already by PK; prevent adding batteries that are not EOL PASS (optional)
create or replace function enforce_eol_pass_for_dispatch_item()
returns trigger as $$
declare e eol_status_t;
begin
  select eol_status into e from batteries where battery_id = new.battery_id;
  if e <> 'PASS' then
    raise exception 'Cannot add battery to dispatch unless EOL PASS (current: %)', e;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_dispatch_item_eol_pass on dispatch_items;
create trigger trg_dispatch_item_eol_pass
before insert on dispatch_items
for each row execute function enforce_eol_pass_for_dispatch_item();

-- ============================================================
-- END
-- ============================================================
