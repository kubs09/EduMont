import { auth } from './components/auth';
import { profile } from './components/profile';
import { classes } from './components/classes';
import { messages } from './components/messages';
import { presentation } from './components/presentation';
import { common } from './components/common';
import { document } from './components/document';
import { user } from './components/user';
import { child } from './components/child';

export const texts = {
  ...auth,
  ...document,
  ...profile,
  ...classes,
  ...messages,
  ...presentation,
  ...common,
  ...user,
  ...child,
  auth,
  document,
  profile,
  classes,
  messages,
  presentation,
  common,
  user,
  child,
};

export type Texts = typeof texts;
export default texts;
