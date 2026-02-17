export const classAgeGroups = [
  { key: 'infant', ageGroup: 'Infant', minAge: 0, maxAge: 1 },
  { key: 'toddler', ageGroup: 'Toddler', minAge: 1, maxAge: 3 },
  { key: 'earlyChildhood', ageGroup: 'Early Childhood', minAge: 3, maxAge: 6 },
  { key: 'lowerElementary', ageGroup: 'Lower Elementary', minAge: 6, maxAge: 9 },
  { key: 'upperElementary', ageGroup: 'Upper Elementary', minAge: 9, maxAge: 12 },
  { key: 'middleSchool', ageGroup: 'Middle School', minAge: 12, maxAge: 15 },
] as const;

export type ClassAgeGroupKey = (typeof classAgeGroups)[number]['key'];

export const resolveAgeGroupKey = (minAge: number, maxAge: number) =>
  classAgeGroups.find((group) => group.minAge === minAge && group.maxAge === maxAge)?.key;
