import { hash, genSalt } from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import {
  childParents,
  children,
  classChildren,
  classTeachers,
  classes,
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

export const grantPresentationPermission = (adminId, classId, granted = true) =>
  db
    .insert(presentationPermissions)
    .values({ adminId, classId, granted, permissionRequested: granted ? true : false })
    .returning()
    .then(([permission]) => permission);

export const createTestPresentation = (childId, classId, overrides = {}) =>
  db
    .insert(presentations)
    .values({ childId, classId, name: `Fixture Presentation ${uniqueSuffix()}`, ...overrides })
    .returning()
    .then(([presentation]) => presentation);

export const createCleanupTracker = () => {
  const created = {
    presentations: [],
    presentationPermissions: [],
    classChildren: [],
    classTeachers: [],
    childParents: [],
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
    for (const c of created.children) {
      // Safety net: also remove rows created as a side effect of the route under
      // test (e.g. class/parent links inserted by create.js) that weren't
      // explicitly tracked above.
      await db.delete(presentations).where(eq(presentations.childId, c.id));
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
