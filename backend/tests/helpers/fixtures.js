import { hash, genSalt } from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import {
  childExcuses,
  childParents,
  children,
  classAttendance,
  classChildren,
  classHistory,
  classTeachers,
  classes,
  documents,
  messages,
  presentationPermissions,
  presentations,
  users,
} from '#backend/db/schema.js';

const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createTestUser = async (role = 'parent') => {
  const salt = await genSalt(10);
  const password = await hash('fixturePassword123', salt);
  const [user] = await db
    .insert(users)
    .values({
      email: `fixture-${uniqueSuffix()}@example.com`,
      firstname: 'Fixture',
      surname: 'User',
      password,
      role,
    })
    .returning();
  return user;
};

export const createTestClass = ({ minAge = 0, maxAge = 6 } = {}) =>
  db
    .insert(classes)
    .values({
      name: `Fixture Class ${uniqueSuffix()}`,
      ageGroup: 'Toddler',
      minAge,
      maxAge,
    })
    .returning()
    .then(([testClass]) => testClass);

export const createTestChild = ({ dateOfBirth = '2020-01-01' } = {}) =>
  db
    .insert(children)
    .values({
      firstname: 'Fixture',
      surname: 'Child',
      dateOfBirth,
    })
    .returning()
    .then(([child]) => child);

export const linkParent = (childId, parentId) =>
  db.insert(childParents).values({ childId, parentId }).returning().then(([link]) => link);

export const linkTeacher = (classId, teacherId, role = 'teacher') =>
  db
    .insert(classTeachers)
    .values({ classId, teacherId, role })
    .returning()
    .then(([link]) => link);

export const linkChildToClass = (childId, classId) =>
  db.insert(classChildren).values({ childId, classId }).returning().then(([link]) => link);

export const grantPresentationPermission = (adminId, classId, granted = true, overrides = {}) =>
  db
    .insert(presentationPermissions)
    .values({
      adminId,
      classId,
      granted,
      permissionRequested: granted ? true : false,
      ...overrides,
    })
    .returning()
    .then(([permission]) => permission);

export const createTestPresentation = (childId, classId, overrides = {}) =>
  db
    .insert(presentations)
    .values({ childId, classId, name: `Fixture Presentation ${uniqueSuffix()}`, ...overrides })
    .returning()
    .then(([presentation]) => presentation);

export const createTestExcuse = (childId, parentId, overrides = {}) =>
  db
    .insert(childExcuses)
    .values({
      childId,
      parentId,
      dateFrom: '2026-01-10',
      dateTo: '2026-01-12',
      reason: 'Fixture excuse',
      ...overrides,
    })
    .returning()
    .then(([excuse]) => excuse);

export const createTestDocument = (overrides = {}) =>
  db
    .insert(documents)
    .values({
      title: `Fixture Document ${uniqueSuffix()}`,
      fileUrl: `https://storage.example.com/documents/fixture-${uniqueSuffix()}.pdf`,
      ...overrides,
    })
    .returning()
    .then(([document]) => document);

export const createTestMessage = (fromUserId, toUserId, overrides = {}) =>
  db
    .insert(messages)
    .values({
      fromUserId,
      toUserId,
      subject: `Fixture Subject ${uniqueSuffix()}`,
      content: 'Fixture message content',
      ...overrides,
    })
    .returning()
    .then(([message]) => message);

export const createTestClassHistory = (classId, createdBy, overrides = {}) =>
  db
    .insert(classHistory)
    .values({
      classId,
      date: '2026-01-10',
      notes: 'Fixture history note',
      createdBy,
      ...overrides,
    })
    .returning()
    .then(([history]) => history);

export const createCleanupTracker = () => {
  const created = {
    presentations: [],
    presentationPermissions: [],
    classChildren: [],
    classTeachers: [],
    childParents: [],
    childExcuses: [],
    classHistory: [],
    classAttendance: [],
    documents: [],
    messages: [],
    children: [],
    classes: [],
    users: [],
  };

  const track = (bucket, row) => {
    created[bucket].push(row);
    return row;
  };

  const cleanup = async () => {
    for (const p of created.presentations) {
      await db.delete(presentations).where(eq(presentations.id, p.id));
    }
    for (const pp of created.presentationPermissions) {
      await db.delete(presentationPermissions).where(eq(presentationPermissions.id, pp.id));
    }
    for (const cc of created.classChildren) {
      await db
        .delete(classChildren)
        .where(and(eq(classChildren.childId, cc.childId), eq(classChildren.classId, cc.classId)));
    }
    for (const ct of created.classTeachers) {
      await db
        .delete(classTeachers)
        .where(and(eq(classTeachers.classId, ct.classId), eq(classTeachers.teacherId, ct.teacherId)));
    }
    for (const cp of created.childParents) {
      await db
        .delete(childParents)
        .where(and(eq(childParents.childId, cp.childId), eq(childParents.parentId, cp.parentId)));
    }
    for (const ce of created.childExcuses) {
      await db.delete(childExcuses).where(eq(childExcuses.id, ce.id));
    }
    for (const ch of created.classHistory) {
      await db.delete(classHistory).where(eq(classHistory.id, ch.id));
    }
    for (const ca of created.classAttendance) {
      await db
        .delete(classAttendance)
        .where(and(eq(classAttendance.classId, ca.classId), eq(classAttendance.childId, ca.childId)));
    }
    for (const d of created.documents) {
      await db.delete(documents).where(eq(documents.id, d.id));
    }
    for (const m of created.messages) {
      await db.delete(messages).where(eq(messages.id, m.id));
    }
    for (const c of created.children) {
      // Safety net: also remove rows created as a side effect of the route under
      // test (e.g. class/parent links inserted by create.js) that weren't
      // explicitly tracked above.
      await db.delete(presentations).where(eq(presentations.childId, c.id));
      await db.delete(documents).where(eq(documents.childId, c.id));
      await db.delete(classChildren).where(eq(classChildren.childId, c.id));
      await db.delete(childParents).where(eq(childParents.childId, c.id));
      await db.delete(children).where(eq(children.id, c.id));
    }
    for (const cls of created.classes) {
      await db.delete(classes).where(eq(classes.id, cls.id));
    }
    for (const u of created.users) {
      await db.delete(users).where(eq(users.id, u.id));
    }
    Object.keys(created).forEach((key) => {
      created[key] = [];
    });
  };

  return { track, cleanup };
};
