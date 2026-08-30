import { createUserSchema } from './userSchema';

describe('createUserSchema', () => {
  const schema = createUserSchema('en');

  it('accepts a valid email and role', () => {
    const result = schema.safeParse({ email: 'teacher@example.com', role: 'teacher' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing email', () => {
    const result = schema.safeParse({ email: '', role: 'teacher' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['email']);
    }
  });

  it('rejects an invalid email format', () => {
    const result = schema.safeParse({ email: 'not-an-email', role: 'teacher' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['email']);
    }
  });

  it('rejects an invalid role', () => {
    const result = schema.safeParse({ email: 'teacher@example.com', role: 'principal' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['role']);
    }
  });
});
