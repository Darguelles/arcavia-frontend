/*
 * Hand-mirrored DTOs for the Arcavia v2 API (public + /account routes).
 * Source of truth: arcavia-api/app/schemas/*.py. Keep in sync manually —
 * no OpenAPI codegen in scope yet (spec §3). Points/money are always integers.
 */

export type UUID = string
export type ISODateTime = string
export type ISODate = string

export type Locale = string
export type Difficulty = 'baja' | 'media' | 'alta'

// Content translation blobs are opaque per-locale maps (§12).
export type Translations = Record<string, Record<string, string>>

// ---------------------------------------------------------------------------
// Auth (schemas/auth.py)
// ---------------------------------------------------------------------------

export interface RegisterRequest {
  email: string
  password: string
  display_name: string
  birth_date: ISODate // immutable after registration (§6.10)
  locale?: Locale
  consent_version: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface SetPasswordRequest {
  new_password: string
  current_password?: string | null
}

// ---------------------------------------------------------------------------
// User / account (schemas/user.py)
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: UUID
  display_name: string
  avatar_url: string | null
  locale: Locale
  role: string
  created_at: ISODateTime
  email: string
  birth_date: ISODate | null
  is_active: boolean
  force_password_reset: boolean
  consent_at: ISODateTime | null
  consent_version: string | null
}

export interface AccountUpdateRequest {
  display_name?: string | null
  locale?: Locale | null
}

export interface AvatarUploadUrlResponse {
  upload_url: string
  asset_key: string
}

export interface AvatarConfirmRequest {
  asset_key: string
}

// ---------------------------------------------------------------------------
// City (schemas/city.py)
// ---------------------------------------------------------------------------

export interface City {
  id: UUID
  slug: string
  name: string
  country: string
  default_locale: Locale
  timezone: string
  center_lat: number
  center_lng: number
  legal_regime: string
  tile_url: string
  is_active: boolean
  launch_date: ISODate | null
}

// GET /cities/resolve — exactly one of city / candidates is populated (§7.1).
export interface CityResolveResponse {
  city: City | null
  candidates: City[]
}

// ---------------------------------------------------------------------------
// Campaign (schemas/campaign.py)
// ---------------------------------------------------------------------------

export interface Campaign {
  id: UUID
  city_id: UUID
  name: string
  description: string
  translations: Translations
  is_active: boolean
  starts_at: ISODateTime | null
  ends_at: ISODateTime | null
  created_at: ISODateTime
  updated_at: ISODateTime
}

// GET /cities/{id}/campaigns is paginated with this envelope.
export interface CampaignList {
  items: Campaign[]
  limit: number
  offset: number
}

// ---------------------------------------------------------------------------
// Mission (schemas/mission.py)
// ---------------------------------------------------------------------------

export interface MissionCard {
  id: UUID
  campaign_id: UUID
  city_id: UUID
  name: string
  description: string
  difficulty: Difficulty
  reward_points: number
  estimated_time_minutes: number
  explorers_count: number
  is_active: boolean
}

export interface MissionCategoryPublic {
  id: UUID
  name: string
  threshold_pct: number
  order_index: number
}

export interface WaypointInMission {
  id: UUID
  name: string
  description: string
  category_id: UUID
  category_name: string
  points: number
  lat: number
  lng: number
  tolerance_radius_m: number
  order_index: number
}

export interface PhaseInMission {
  id: UUID
  name: string
  order_index: number
  waypoints: WaypointInMission[]
}

export interface RewardTeaser {
  name: string
  image_url: string | null
}

export interface MissionDetail {
  id: UUID
  campaign_id: UUID
  city_id: UUID
  name: string
  description: string
  translations: Translations
  difficulty: Difficulty
  reward_points: number
  estimated_time_minutes: number
  explorers_count: number
  is_active: boolean
  categories: MissionCategoryPublic[]
  phases: PhaseInMission[]
  available_rewards: RewardTeaser[]
}

// ---------------------------------------------------------------------------
// Challenge / gameplay (schemas/challenge.py, schemas/waypoint.py)
// ---------------------------------------------------------------------------

// Player-facing option — NEVER carries is_correct (§9 anti-cheat guard).
export interface ChallengeOptionPublic {
  id: UUID
  text: string
  translations: Translations
  order_index: number
}

export interface ChallengePublic {
  id: UUID
  waypoint_id: UUID
  prompt: string
  translations: Translations
  order_index: number
  is_riddle: boolean
  // options arrive pre-shuffled by the server — do NOT re-sort (§8.8/§9).
  options: ChallengeOptionPublic[]
}

export interface ValidateScanRequest {
  token: UUID
  lat: number
  lng: number
}

export interface ValidateScanResponse {
  status: string
  challenges: ChallengePublic[]
}

export interface AnswerRequest {
  selected_option_id: UUID
}

export interface CategoryProgressEntry {
  category_id: UUID
  name: string
  earned_pct: number
}

export interface RewardEarnedEntry {
  reward_id: UUID
  name: string
  image_url: string | null
}

export interface AnswerResponse {
  correct: boolean
  // present only on a correct answer (§8.1) — simply absent otherwise.
  keyword?: string | null
  fun_fact?: string | null
  waypoint_complete: boolean
  mission_complete: boolean
  category_progress: CategoryProgressEntry[]
  rewards_earned: RewardEarnedEntry[]
}

// ---------------------------------------------------------------------------
// Progress / me (schemas/progress.py)
// ---------------------------------------------------------------------------

export interface CategoryBreakdown {
  category_id: UUID
  name: string
  points_earned: number
  total_points: number
  earned_pct: number
}

export interface MissionProgressDetail {
  mission_id: UUID
  mission_name: string
  status: string
  riddle_solved: boolean
  points_awarded: number
  categories: CategoryBreakdown[]
}

export interface MyProgressResponse {
  total_points: number
  missions_completed: number
  challenges_completed: number
  missions: MissionProgressDetail[]
}

export interface AnswerHistoryEntry {
  challenge_id: UUID
  mission_name: string
  waypoint_name: string
  order_index: number
  keyword: string | null
  is_riddle: boolean
  correct: boolean
  answered_at: ISODateTime
}

export interface AnswerHistoryResponse {
  items: AnswerHistoryEntry[]
  limit: number
  offset: number
}

// NOTE: leaderboard entries carry only user_id — the API does NOT return a
// display name yet. Render rank + points and treat the name as best-effort.
export interface LeaderboardEntry {
  user_id: string
  points: number
  rank: number
}

export interface LeaderboardResponse {
  city_id: UUID
  entries: LeaderboardEntry[]
}

// ---------------------------------------------------------------------------
// Rewards (schemas/reward.py)
// ---------------------------------------------------------------------------

export interface UserReward {
  reward_id: UUID
  name: string
  description: string
  image_url: string | null
  validity_starts_at: ISODateTime
  validity_ends_at: ISODateTime
  earned_at: ISODateTime
  currently_valid: boolean
}

export interface UserRewardList {
  items: UserReward[]
  limit: number
  offset: number
}

// ---------------------------------------------------------------------------
// Errors (errors.py envelope)
// ---------------------------------------------------------------------------

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}
