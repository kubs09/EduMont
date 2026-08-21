import { jest } from '@jest/globals';

export const makeChain = (result) => {
  const handler = {
    get(target, prop) {
      if (prop === 'then') {
        return (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected);
      }
      if (prop === 'catch') {
        return (onRejected) => Promise.resolve(result).catch(onRejected);
      }
      if (!(prop in target)) {
        target[prop] = jest.fn(() => proxy);
      }
      return target[prop];
    },
  };
  const proxy = new Proxy({}, handler);
  return proxy;
};

export const makeDbMock = () => ({
  select: jest.fn(),
  update: jest.fn(),
  transaction: jest.fn(),
});
