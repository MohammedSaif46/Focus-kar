export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  onboarding_completed: number;
  accessibility_granted: number;
  notifications_granted: number;
  streak_count: number;
  last_focus_date: string | null;
  streak_freeze_used_this_week: number;
  last_freeze_reset_date: string | null;
  focus_coins: number;
  emergency_unlocks_today: number;
  last_unlock_date: string | null;
  level: number;
  experience: number;
  porn_blocker_enabled: number;
  strict_porn_blocker: number;
  porn_blocker_pin: string | null;
  theme: string;
  reels_blocked: number;
  shorts_blocked: number;
  facebook_blocked: number;
}

export interface FocusSession {
  id: number;
  user_id: number;
  start_time: string;
  duration_minutes: number;
  completed: number;
  tree_type: string;
  coins_earned: number;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  category: string;
  duration_minutes: number;
  completed: number;
  created_at: string;
}
