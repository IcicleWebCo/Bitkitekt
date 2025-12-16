export const TIMEOUTS = {
  DEBOUNCE_FILTER_PREFERENCES: 1000,
  USERNAME_CHECK_DEBOUNCE: 500,
} as const;

export const LIMITS = {
  MAX_COMMENT_LENGTH: 2000,
  MAX_COMMENT_DEPTH: 5,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  PASSWORD_MIN_LENGTH: 8,
} as const;

export const ROUTES = {
  HOME: '/',
  POSTS: '/posts',
  POST_DETAIL: '/posts/:id',
  PROFILE: '/profile',
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',
} as const;

export const TOPIC_SHORT_NAMES: Record<string, string> = {
  'Entity Framework Core': 'EF Core',
  '.NET 8+': '.NET 8+',
} as const;

export const DIFFICULTY_LEVELS = ['Beginner', 'Junior', 'Senior'] as const;

export const DIFFICULTY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Beginner': {
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    text: 'text-green-300'
  },
  'Junior': {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-300'
  },
  'Senior': {
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-300'
  }
} as const;

export const RISK_COLORS = {
  Low: 'bg-green-500/20 text-green-300 border-green-500/50',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
  High: 'bg-red-500/20 text-red-300 border-red-500/50',
} as const;

export const CHAR_LIMITS = {
  COMMENT_WARNING_THRESHOLD: 100,
} as const;

export const SCROLL_BEHAVIOR = {
  HEADER_HIDE_THRESHOLD: 100,
  SCROLL_AMOUNT: 300,
} as const;
