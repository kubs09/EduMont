import { jest } from '@jest/globals';

export const makeChain = (result) => {
  const chain = {};
  const returnChain = () => chain;

  chain.from = jest.fn(returnChain);
  chain.where = jest.fn(returnChain);
  chain.set = jest.fn(returnChain);
  chain.limit = jest.fn(() => Promise.resolve(result));
  chain.returning = jest.fn(() => Promise.resolve(result));
  chain.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected);
  chain.catch = (onRejected) => Promise.resolve(result).catch(onRejected);

  return chain;
};

export const makeDbMock = () => ({
  select: jest.fn(),
  update: jest.fn(),
  transaction: jest.fn(),
});
