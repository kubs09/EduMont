export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/messages', // Changed from '/dashboard'
  ROOT: '/',
  UNAUTHORIZED: '/unauthorized',
  USER_DASHBOARD: '/users',
  HOME: '/',
  MESSAGES: '/messages',
  CHILD_PROGRESS: '/progress',
  DAILY_ACTIVITIES: '/activities',
  PARENT_DASHBOARD: '/parent-dashboard',
  TEACHER_DASHBOARD: '/teacher-dashboard',
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile/edit',
  PROFILE_CHANGE_PASSWORD: '/profile/change-password',
  REGISTER_INVITE: '/register/invite/:token',
  CLASSES: '/classes',
  CLASS_DETAIL: '/classes/:id', // Add this line
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
} as const;
