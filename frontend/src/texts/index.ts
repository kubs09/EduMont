import { auth } from './components/auth';
import { profile } from './components/profile';
import { classes } from './components/classes';
import { messages } from './components/messages';
import { presentation } from './components/presentation';
import { common } from './components/common';
import { user } from './components/user';
import { children } from './components/children';
import { home } from './components/home';
import { staticPages } from './components/staticPages';

export const texts = {
  auth,
  profile,
  classes,
  messages,
  presentation,
  common,
  user,
  children,
  home,
  staticPages,
};

export type Texts = typeof texts;
export default texts;
