import { createDocumentSchema } from './documentSchema';

const makeFile = (name: string, sizeBytes: number, type = 'application/pdf') =>
  new File([new Uint8Array(sizeBytes)], name, { type });

describe('createDocumentSchema', () => {
  const schema = createDocumentSchema('en');

  it('accepts a valid file with no title or description', () => {
    const result = schema.safeParse({ file: makeFile('report.pdf', 1024) });
    expect(result.success).toBe(true);
  });

  it('accepts a valid file with title and description', () => {
    const result = schema.safeParse({
      title: 'Report',
      description: 'Q1 report',
      file: makeFile('report.pdf', 1024),
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing file', () => {
    const result = schema.safeParse({ title: 'Report' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['file']);
    }
  });

  it('rejects a file over 5MB', () => {
    const result = schema.safeParse({ file: makeFile('report.pdf', 6 * 1024 * 1024) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['file']);
    }
  });

  it('rejects a disallowed file extension', () => {
    const result = schema.safeParse({ file: makeFile('script.exe', 1024) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['file']);
    }
  });

  it('rejects a title over 200 characters', () => {
    const result = schema.safeParse({
      title: 'a'.repeat(201),
      file: makeFile('report.pdf', 1024),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['title']);
    }
  });

  it('rejects a description over 1000 characters', () => {
    const result = schema.safeParse({
      description: 'a'.repeat(1001),
      file: makeFile('report.pdf', 1024),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['description']);
    }
  });
});
