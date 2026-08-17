import { profile } from './components/profile';
import { classes } from './components/classes';
import { messages } from './components/messages';
import { schedule } from './components/schedule';
import { common } from './components/common';
import { userDashboard } from './components/userDashboard';
import { children } from './components/children';
import { home } from './components/home';
import { staticPages } from './components/staticPages';
import { login } from './components/login';
import { signUp } from './components/signUp';

export const texts = {
  profile,
  classes,
  messages,
  schedule,
  common,
  userDashboard,
  children,
  home,
  staticPages,
  login,
  signUp,
};

export type Texts = typeof texts;
export default texts;
