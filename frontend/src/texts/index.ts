import { auth } from './components/auth';
import { profile } from './components/profile';
import { classes } from './components/classes';
import { messages } from './components/messages';
import { schedule } from './components/schedule';
import { common } from './components/common';
import { document } from './components/document';

export const texts = {
  ...auth,
  ...document,
  ...profile,
  ...classes,
  ...messages,
  ...schedule,
  ...common,
  auth,
  document,
  profile,
  classes,
  messages,
  schedule,
  common,
};

export type Texts = typeof texts;
export default texts;
