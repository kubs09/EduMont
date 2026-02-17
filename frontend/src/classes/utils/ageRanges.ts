export const classAgeRanges = [
  { key: 'earlyChildhood', minAge: 3, maxAge: 6 },
  { key: 'lowerElementary', minAge: 6, maxAge: 9 },
  { key: 'upperElementary', minAge: 9, maxAge: 12 },
] as const;

export type ClassAgeRangeKey = (typeof classAgeRanges)[number]['key'];

export const resolveAgeRangeKey = (minAge: number, maxAge: number) =>
  classAgeRanges.find((range) => range.minAge === minAge && range.maxAge === maxAge)?.key;
