import { auth } from './components/auth';
import { profile } from './components/profile';
import { classes } from './components/classes';
import { messages } from './components/messages';
import { schedule } from './components/schedule';
import { common } from './components/common';

export const texts = {
  ...auth,
  ...profile,
  ...classes,
  ...messages,
  ...schedule,
  ...common,
  auth,
  profile,
  classes,
  messages,
  schedule,
  common,
};

export type Texts = typeof texts;
export default texts;
