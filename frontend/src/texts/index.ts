import { profile } from './components/profile';
import { classes } from './components/classes';
import { messages } from './components/messages';
import { presentation } from './components/presentation';
import { common } from './components/common';
import { user } from './components/user';
import { children } from './components/children';
import { home } from './components/home';
import { staticPages } from './components/staticPages';
import { login } from './components/login';
import { signUp } from './components/signUp';

export const texts = {
  profile,
  classes,
  messages,
  presentation,
  common,
  user,
  children,
  home,
  staticPages,
  login,
  signUp,
};

export type Texts = typeof texts;
export default texts;
