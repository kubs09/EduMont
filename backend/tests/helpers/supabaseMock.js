import { jest } from '@jest/globals';

export const createSupabaseMock = () => {
  const bucket = {
    createSignedUploadUrl: jest.fn(),
    remove: jest.fn(),
  };
  return {
    storage: {
      from: jest.fn(() => bucket),
    },
  };
};
