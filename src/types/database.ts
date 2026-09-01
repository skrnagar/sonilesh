export type OrgStatus =
  | "pending"
  | "trial"
  | "active"
  | "suspended"
  | "cancelled"
  | "churned";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "paused"
  | "expired";

export type EhsEventStatus =
  | "draft"
  | "submitted"
  | "triage"
  | "investigation"
  | "capa"
  | "verification"
  | "approval"
  | "closed"
  | "reopened"
  | "cancelled";

export type MemberStatus = "invited" | "active" | "suspended" | "removed";

export type LmraStatus = "draft" | "submitted" | "approved" | "rejected";

export type UaucStage =
  | "reported"
  | "allocated"
  | "action_in_progress"
  | "assignee_closed"
  | "final_closed";

export interface Region {
  id: string;
  organization_id: string;
  business_unit_id: string | null;
  name: string;
  code: string;
  status: string;
}

export interface LmraAssessment {
  id: string;
  organization_id: string;
  assessment_number: string;
  status: LmraStatus;
  activity_description: string;
}

export interface SiteVisit {
  id: string;
  organization_id: string;
  visit_number: string;
  visit_type: "hsv" | "rsv" | "tsv";
  status: string;
}

export interface MisSubmission {
  id: string;
  organization_id: string;
  submission_number: string;
  status: string;
}

export interface EhsScorePeriod {
  id: string;
  organization_id: string;
  label: string;
  overall_score: number | null;
  is_demo: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_platform_admin: boolean;
  platform_role?: string | null;
  locale: string;
  timezone: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  industry: string | null;
  company_type: string | null;
  status: OrgStatus;
  logo_url: string | null;
  website: string | null;
  country: string | null;
  timezone: string;
  onboarding_completed_at: string | null;
  trial_ends_at: string | null;
  last_activity_at: string | null;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  status: MemberStatus;
  title: string | null;
  is_owner: boolean;
}

export interface Role {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  is_system: boolean;
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string | null;
}

export interface Feature {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: "module" | "limit" | "integration" | "addon";
  value_type: "boolean" | "numeric" | "unlimited";
  is_active: boolean;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_public: boolean;
  is_custom: boolean;
  sort_order: number;
  trial_days: number;
  price_monthly_cents: number;
  price_yearly_cents: number;
  currency: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_interval: "monthly" | "yearly";
  current_period_start: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  custom_price_monthly_cents: number | null;
  custom_price_yearly_cents: number | null;
}

export interface Site {
  id: string;
  organization_id: string;
  business_unit_id: string | null;
  name: string;
  code: string;
  is_active: boolean;
}

export interface EventType {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  feature_code: string;
  is_system: boolean;
  is_active: boolean;
}

export interface SeverityLevel {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  rank: number;
  requires_investigation: boolean;
}

export interface EhsEvent {
  id: string;
  organization_id: string;
  event_type_id: string;
  event_category_id: string | null;
  event_number: string;
  site_id: string | null;
  project_id: string | null;
  department_id: string | null;
  location_id: string | null;
  severity_id: string | null;
  status: EhsEventStatus;
  title: string | null;
  description: string;
  occurred_at: string;
  reported_at: string | null;
  reporter_id: string | null;
  is_anonymous: boolean;
  immediate_action: string | null;
  assigned_to: string | null;
  investigator_id: string | null;
  equipment_assets: string | null;
  investigation_required: boolean;
  no_action_required: boolean;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CapaItem {
  id: string;
  organization_id: string;
  source_module: string;
  source_record_id: string;
  event_id: string | null;
  title: string;
  description: string | null;
  capa_type: "corrective" | "preventive";
  status: "open" | "in_progress" | "pending_verification" | "verified" | "closed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  owner_id: string | null;
  due_date: string | null;
  is_required: boolean;
  verification_required?: boolean;
  evidence?: string | null;
}

export interface RiskAssessment {
  id: string;
  organization_id: string;
  assessment_number: string;
  title: string;
  status: string;
  inherent_risk_score: number | null;
  residual_risk_score: number | null;
  inherent_risk_band: string | null;
  residual_risk_band: string | null;
}

export interface Permit {
  id: string;
  organization_id: string;
  permit_number: string;
  title: string;
  status: string;
  valid_from: string | null;
  valid_to: string | null;
  risk_assessment_id: string | null;
}

export interface ChecklistAssignment {
  id: string;
  organization_id: string;
  assignment_number: string;
  checklist_type: "inspection" | "audit";
  title: string;
  status: string;
  score_percent: number | null;
}

export interface EntitlementResult {
  enabled: boolean;
  unlimited: boolean;
  limitValue: number | null;
  source: "override" | "plan" | "default";
}

export interface LimitCheckResult {
  allowed: boolean;
  remaining: number | null;
  limit: number | null;
  unlimited: boolean;
}
