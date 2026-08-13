import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { and, eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestClass,
  createTestChild,
  createTestPresentation,
  linkParent,
  linkChildToClass,
  createCleanupTracker,
} from '../../../helpers/fixtures.js';

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { childParents, classChildren, presentations } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const dateOfBirthForAge = (age) => {
  const now = new Date();
  return `${now.getFullYear() - age}-01-01`;
};

describe('PUT /api/children/:id (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app)
      .put('/api/children/1')
      .send({ firstname: 'Ada', surname: 'Lovelace' });

    expect(res.status).toBe(401);
  });

  test('404 for an unknown child', async () => {
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .put('/api/children/999999999')
      .set('Authorization', authHeader(admin))
      .send({ firstname: 'Ada', surname: 'Lovelace' });

    expect(res.status).toBe(404);
  });

  test("403 when a parent isn't linked to the child", async () => {
    const parent = track('users', await createTestUser('parent'));
    const child = track('children', await createTestChild());

    const res = await request(app)
      .put(`/api/children/${child.id}`)
      .set('Authorization', authHeader(parent))
      .send({ firstname: 'Ada', surname: 'Lovelace' });

    expect(res.status).toBe(403);
  });

  test('updates firstname/surname/notes for a linked parent', async () => {
    const parent = track('users', await createTestUser('parent'));
    const child = track('children', await createTestChild({ dateOfBirth: '2020-01-01' }));
    track('childParents', await linkParent(child.id, parent.id));

    const res = await request(app)
      .put(`/api/children/${child.id}`)
      .set('Authorization', authHeader(parent))
      .send({ firstname: 'Grace', surname: 'Hopper', notes: 'Loves puzzles' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: child.id, firstname: 'Grace', surname: 'Hopper', notes: 'Loves puzzles' });
  });

  test('reassigns class and updates classChildren when the child has no existing presentations', async () => {
    const admin = track('users', await createTestUser('admin'));
    const oldClass = track('classes', await createTestClass({ minAge: 0, maxAge: 10 }));
    const newClass = track('classes', await createTestClass({ minAge: 0, maxAge: 10 }));
    const child = track('children', await createTestChild({ dateOfBirth: dateOfBirthForAge(4) }));
    track('classChildren', await linkChildToClass(child.id, oldClass.id));

    const res = await request(app)
      .put(`/api/children/${child.id}`)
      .set('Authorization', authHeader(admin))
      .send({ firstname: child.firstname, surname: child.surname, class_id: newClass.id });

    expect(res.status).toBe(200);
    expect(res.body.classId).toBe(newClass.id);

    const [link] = await db.select().from(classChildren).where(eq(classChildren.childId, child.id));
    expect(link.classId).toBe(newClass.id);
  });

  test('reassigns class and updates classChildren + presentations.classId when the child has an existing presentation', async () => {
    const admin = track('users', await createTestUser('admin'));
    const oldClass = track('classes', await createTestClass({ minAge: 0, maxAge: 10 }));
    const newClass = track('classes', await createTestClass({ minAge: 0, maxAge: 10 }));
    const child = track('children', await createTestChild({ dateOfBirth: dateOfBirthForAge(4) }));
    track('classChildren', await linkChildToClass(child.id, oldClass.id));
    const presentation = track('presentations', await createTestPresentation(child.id, oldClass.id));

    const res = await request(app)
      .put(`/api/children/${child.id}`)
      .set('Authorization', authHeader(admin))
      .send({ firstname: child.firstname, surname: child.surname, class_id: newClass.id });

    expect(res.status).toBe(200);
    expect(res.body.classId).toBe(newClass.id);

    const [link] = await db.select().from(classChildren).where(eq(classChildren.childId, child.id));
    expect(link.classId).toBe(newClass.id);

    const [updatedPresentation] = await db
      .select()
      .from(presentations)
      .where(eq(presentations.id, presentation.id));
    expect(updatedPresentation.classId).toBe(newClass.id);
  });

  test('400 selectedClassNotSuitable for an unsuitable class_id', async () => {
    const admin = track('users', await createTestUser('admin'));
    const child = track('children', await createTestChild({ dateOfBirth: dateOfBirthForAge(4) }));
    const wrongClass = track('classes', await createTestClass({ minAge: 10, maxAge: 15 }));

    const res = await request(app)
      .put(`/api/children/${child.id}`)
      .set('Authorization', authHeader(admin))
      .send({ firstname: child.firstname, surname: child.surname, class_id: wrongClass.id });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'selectedClassNotSuitable' });
  });

  test('non-admin sending parent_ids gets 403', async () => {
    const teacher = track('users', await createTestUser('teacher'));
    const child = track('children', await createTestChild());

    const res = await request(app)
      .put(`/api/children/${child.id}`)
      .set('Authorization', authHeader(teacher))
      .send({ firstname: child.firstname, surname: child.surname, parent_ids: [1] });

    expect(res.status).toBe(403);
  });

  test('admin reassigning parents updates childParents', async () => {
    const admin = track('users', await createTestUser('admin'));
    const oldParent = track('users', await createTestUser('parent'));
    const newParent = track('users', await createTestUser('parent'));
    const child = track('children', await createTestChild());
    track('childParents', await linkParent(child.id, oldParent.id));

    const res = await request(app)
      .put(`/api/children/${child.id}`)
      .set('Authorization', authHeader(admin))
      .send({ firstname: child.firstname, surname: child.surname, parent_ids: [newParent.id] });

    expect(res.status).toBe(200);
    expect(res.body.parents).toEqual([
      expect.objectContaining({ id: newParent.id }),
    ]);

    const oldLink = await db
      .select()
      .from(childParents)
      .where(and(eq(childParents.childId, child.id), eq(childParents.parentId, oldParent.id)));
    expect(oldLink).toHaveLength(0);
  });

  test('200 with the updated child on success', async () => {
    const admin = track('users', await createTestUser('admin'));
    const child = track('children', await createTestChild());

    const res = await request(app)
      .put(`/api/children/${child.id}`)
      .set('Authorization', authHeader(admin))
      .send({ firstname: 'Marie', surname: 'Curie' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: child.id, firstname: 'Marie', surname: 'Curie' });
  });
});
