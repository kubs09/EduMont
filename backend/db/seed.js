import 'dotenv/config';
import console from 'console';
import { inArray } from 'drizzle-orm';
import process from 'process';
import {
  categoryPresentations,
  childParents,
  children,
  classAttendance,
  classChildren,
  classTeachers,
  classes,
  presentations,
  users,
} from './schema.js';
import { closePool, db, pool } from './client.js';

const userSeedRows = [
  {
    email: 'admin@example.com',
    firstname: 'Admin',
    surname: 'Admin',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'admin',
  },
  {
    email: 'petr.novak@example.com',
    firstname: 'Petr',
    surname: 'Novák',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'parent',
  },
  {
    email: 'lucie.dvorakova@example.com',
    firstname: 'Lucie',
    surname: 'Dvořáková',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'parent',
  },
  {
    email: 'karel.svoboda@example.com',
    firstname: 'Karel',
    surname: 'Svoboda',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'parent',
  },
  {
    email: 'radek.jelinek@example.com',
    firstname: 'Radek',
    surname: 'Jelinek',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'parent',
  },
  {
    email: 'lenka.stankova@example.com',
    firstname: 'Lenka',
    surname: 'Stankova',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'parent',
  },
  {
    email: 'michal.rehak@example.com',
    firstname: 'Michal',
    surname: 'Rehak',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'parent',
  },
  {
    email: 'jana.kralova@example.com',
    firstname: 'Jana',
    surname: 'Králová',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'martin.novotny@example.com',
    firstname: 'Martin',
    surname: 'Novotný',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'eva.svobodova@example.com',
    firstname: 'Eva',
    surname: 'Svobodová',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'alena.malikova@example.com',
    firstname: 'Alena',
    surname: 'Malikova',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'ondrej.kucera@example.com',
    firstname: 'Ondrej',
    surname: 'Kucera',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'lucas.prochazka@example.com',
    firstname: 'Lucas',
    surname: 'Prochazka',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'simona.havlova@example.com',
    firstname: 'Simona',
    surname: 'Havlova',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'petr.horak@example.com',
    firstname: 'Petr',
    surname: 'Horak',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'klara.benesova@example.com',
    firstname: 'Klara',
    surname: 'Benesova',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'daniel.kolar@example.com',
    firstname: 'Daniel',
    surname: 'Kolar',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'martina.vackova@example.com',
    firstname: 'Martina',
    surname: 'Vackova',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'veronika.krizova@example.com',
    firstname: 'Veronika',
    surname: 'Krizova',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'tomas.novak@example.com',
    firstname: 'Tomas',
    surname: 'Novak',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'katerina.cerna@example.com',
    firstname: 'Katerina',
    surname: 'Cerna',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'jakub.dvorak@example.com',
    firstname: 'Jakub',
    surname: 'Dvorak',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'petra.holubova@example.com',
    firstname: 'Petra',
    surname: 'Holubova',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'milan.pesek@example.com',
    firstname: 'Milan',
    surname: 'Pesek',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'zuzana.bartova@example.com',
    firstname: 'Zuzana',
    surname: 'Bartova',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'david.maly@example.com',
    firstname: 'David',
    surname: 'Maly',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'lenka.novotna@example.com',
    firstname: 'Lenka',
    surname: 'Novotna',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'michal.cerny@example.com',
    firstname: 'Michal',
    surname: 'Cerny',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'hana.pokorova@example.com',
    firstname: 'Hana',
    surname: 'Pokorova',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'pavel.vesely@example.com',
    firstname: 'Pavel',
    surname: 'Vesely',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'barbora.mrazova@example.com',
    firstname: 'Barbora',
    surname: 'Mrazova',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'jan.svoboda@example.com',
    firstname: 'Jan',
    surname: 'Svoboda',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'tereza.adamova@example.com',
    firstname: 'Tereza',
    surname: 'Adamova',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'lukas.nemec@example.com',
    firstname: 'Lukas',
    surname: 'Nemec',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'anna.vlkova@example.com',
    firstname: 'Anna',
    surname: 'Vlkova',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'radek.moravec@example.com',
    firstname: 'Radek',
    surname: 'Moravec',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
  {
    email: 'ivana.fiala@example.com',
    firstname: 'Ivana',
    surname: 'Fiala',
    password: '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm',
    role: 'teacher',
  },
];

const childSeedRows = [
  { firstname: 'Jakub', surname: 'Novák', dateOfBirth: '2022-01-01', notes: 'Alergie na ořechy' },
  {
    firstname: 'Ema',
    surname: 'Dvořáková',
    dateOfBirth: '2020-01-01',
    notes: 'Bez speciálních požadavků',
  },
  {
    firstname: 'Tereza',
    surname: 'Svobodová',
    dateOfBirth: '2017-01-01',
    notes: 'Vegetariánská strava',
  },
  {
    firstname: 'Filip',
    surname: 'Jelinek',
    dateOfBirth: '2021-05-15',
    notes: 'Bez speciálních požadavků',
  },
  {
    firstname: 'Sofie',
    surname: 'Stankova',
    dateOfBirth: '2019-03-10',
    notes: 'Alergie na laktózu',
  },
  {
    firstname: 'Adam',
    surname: 'Rehak',
    dateOfBirth: '2014-09-22',
    notes: 'Bez speciálních požadavků',
  },
  {
    firstname: 'Klara',
    surname: 'Vesela',
    dateOfBirth: '2018-11-02',
    notes: 'Vegetariánská strava',
  },
  { firstname: 'Matej', surname: 'Kubik', dateOfBirth: '2016-07-08', notes: 'Alergie na ořechy' },
  {
    firstname: 'Nina',
    surname: 'Urbanova',
    dateOfBirth: '2013-02-19',
    notes: 'Bez speciálních požadavků',
  },
];

const classSeedRows = [
  {
    name: 'Nido - Butterflies',
    description: 'Nido environment for infants',
    ageGroup: 'Infant',
    minAge: 0,
    maxAge: 1,
  },
  {
    name: 'Nido - Ladybugs',
    description: 'Nido environment for infants',
    ageGroup: 'Infant',
    minAge: 0,
    maxAge: 1,
  },
  {
    name: 'Toddler - Caterpillars',
    description: 'Toddler community for young children',
    ageGroup: 'Toddler',
    minAge: 1,
    maxAge: 3,
  },
  {
    name: 'Toddler - Fireflies',
    description: 'Toddler community for young children',
    ageGroup: 'Toddler',
    minAge: 1,
    maxAge: 3,
  },
  {
    name: 'Early Childhood - Sunflowers',
    description: 'Early Childhood group focusing on practical life and sensorial work',
    ageGroup: 'Early Childhood',
    minAge: 3,
    maxAge: 6,
  },
  {
    name: 'Early Childhood - Bumblebees',
    description: 'Early Childhood group with emphasis on language and mathematics',
    ageGroup: 'Early Childhood',
    minAge: 3,
    maxAge: 6,
  },
  {
    name: 'Early Childhood - Daisies',
    description: 'Early Childhood group for mixed-age learning',
    ageGroup: 'Early Childhood',
    minAge: 3,
    maxAge: 6,
  },
  {
    name: 'Lower Elementary - Explorers',
    description: 'Lower Elementary group for cosmic education and research',
    ageGroup: 'Lower Elementary',
    minAge: 6,
    maxAge: 9,
  },
  {
    name: 'Lower Elementary - Inventors',
    description: 'Lower Elementary group focusing on science and mathematics',
    ageGroup: 'Lower Elementary',
    minAge: 6,
    maxAge: 9,
  },
  {
    name: 'Lower Elementary - Discoverers',
    description: 'Lower Elementary group with arts integration',
    ageGroup: 'Lower Elementary',
    minAge: 6,
    maxAge: 9,
  },
  {
    name: 'Upper Elementary - Trailblazers',
    description: 'Upper Elementary group for advanced studies',
    ageGroup: 'Upper Elementary',
    minAge: 9,
    maxAge: 12,
  },
  {
    name: 'Upper Elementary - Navigators',
    description: 'Upper Elementary group with STEM focus',
    ageGroup: 'Upper Elementary',
    minAge: 9,
    maxAge: 12,
  },
  {
    name: 'Upper Elementary - Pioneers',
    description: 'Upper Elementary group emphasizing leadership',
    ageGroup: 'Upper Elementary',
    minAge: 9,
    maxAge: 12,
  },
  {
    name: 'Middle School - Scholars',
    description: 'Middle School community for adolescent program',
    ageGroup: 'Middle School',
    minAge: 12,
    maxAge: 15,
  },
  {
    name: 'Middle School - Innovators',
    description: 'Middle School community with entrepreneurship focus',
    ageGroup: 'Middle School',
    minAge: 12,
    maxAge: 15,
  },
];

const categoryPresentationSeedRows = [
  {
    category: 'Practical Life',
    name: 'Grasping Objects',
    ageGroup: 'Infant',
    displayOrder: 1,
    notes: 'Practice reaching and grasping',
  },
  {
    category: 'Practical Life',
    name: 'Assisted Sitting',
    ageGroup: 'Infant',
    displayOrder: 2,
    notes: 'Work on sitting balance',
  },
  {
    category: 'Sensorial',
    name: 'Visual Tracking',
    ageGroup: 'Infant',
    displayOrder: 1,
    notes: 'Track moving objects with eyes',
  },
  {
    category: 'Sensorial',
    name: 'Tactile Exploration',
    ageGroup: 'Infant',
    displayOrder: 2,
    notes: 'Explore textures with hands',
  },
  {
    category: 'Language',
    name: 'Sound Awareness',
    ageGroup: 'Infant',
    displayOrder: 1,
    notes: 'Respond to sounds and voices',
  },
  {
    category: 'Language',
    name: 'Babbling',
    ageGroup: 'Infant',
    displayOrder: 2,
    notes: 'Practice vocal sounds',
  },
  {
    category: 'Mathematics',
    name: 'Object Permanence',
    ageGroup: 'Infant',
    displayOrder: 1,
    notes: 'Understanding objects exist when hidden',
  },
  {
    category: 'Culture',
    name: 'Face Recognition',
    ageGroup: 'Infant',
    displayOrder: 1,
    notes: 'Recognize familiar faces',
  },
  {
    category: 'Practical Life',
    name: 'Pouring Water',
    ageGroup: 'Toddler',
    displayOrder: 1,
    notes: 'Pour from pitcher to cup',
  },
  {
    category: 'Practical Life',
    name: 'Buttoning Frames',
    ageGroup: 'Toddler',
    displayOrder: 2,
    notes: 'Practice buttoning clothing',
  },
  {
    category: 'Practical Life',
    name: 'Hand Washing',
    ageGroup: 'Toddler',
    displayOrder: 3,
    notes: 'Independent hand washing routine',
  },
  {
    category: 'Sensorial',
    name: 'Size Sorting',
    ageGroup: 'Toddler',
    displayOrder: 1,
    notes: 'Sort objects by size',
  },
  {
    category: 'Sensorial',
    name: 'Color Matching',
    ageGroup: 'Toddler',
    displayOrder: 2,
    notes: 'Match primary colors',
  },
  {
    category: 'Sensorial',
    name: 'Texture Cards',
    ageGroup: 'Toddler',
    displayOrder: 3,
    notes: 'Match rough and smooth textures',
  },
  {
    category: 'Mathematics',
    name: 'Counting 1-5',
    ageGroup: 'Toddler',
    displayOrder: 1,
    notes: 'Count objects up to 5',
  },
  {
    category: 'Mathematics',
    name: 'Shape Recognition',
    ageGroup: 'Toddler',
    displayOrder: 2,
    notes: 'Identify circle, square, triangle',
  },
  {
    category: 'Culture',
    name: 'Animal Recognition',
    ageGroup: 'Toddler',
    displayOrder: 1,
    notes: 'Identify common animals',
  },
  {
    category: 'Culture',
    name: 'Simple Songs',
    ageGroup: 'Toddler',
    displayOrder: 2,
    notes: 'Learn nursery rhymes',
  },
  {
    category: 'Language',
    name: 'Vocabulary Building',
    ageGroup: 'Toddler',
    displayOrder: 1,
    notes: 'Learn names of familiar objects',
  },
  {
    category: 'Language',
    name: 'Two-Word Phrases',
    ageGroup: 'Toddler',
    displayOrder: 2,
    notes: 'Combine two words in speech',
  },
  {
    category: 'Practical Life',
    name: 'Pouring and Transferring',
    ageGroup: 'Early Childhood',
    displayOrder: 1,
    notes: 'Transfer beans using spoon',
  },
  {
    category: 'Practical Life',
    name: 'Buttoning and Zipping',
    ageGroup: 'Early Childhood',
    displayOrder: 2,
    notes: 'Complete dressing frames',
  },
  {
    category: 'Practical Life',
    name: 'Table Setting',
    ageGroup: 'Early Childhood',
    displayOrder: 3,
    notes: 'Set table for snack',
  },
  {
    category: 'Practical Life',
    name: 'Grace and Courtesy',
    ageGroup: 'Early Childhood',
    displayOrder: 4,
    notes: 'Practice polite interactions',
  },
  {
    category: 'Sensorial',
    name: 'Pink Tower',
    ageGroup: 'Early Childhood',
    displayOrder: 1,
    notes: 'Build tower by size',
  },
  {
    category: 'Sensorial',
    name: 'Brown Stair',
    ageGroup: 'Early Childhood',
    displayOrder: 2,
    notes: 'Order blocks by width',
  },
  {
    category: 'Sensorial',
    name: 'Color Tablets Box 1',
    ageGroup: 'Early Childhood',
    displayOrder: 3,
    notes: 'Match primary colors',
  },
  {
    category: 'Sensorial',
    name: 'Sound Cylinders',
    ageGroup: 'Early Childhood',
    displayOrder: 4,
    notes: 'Match sounds by volume',
  },
  {
    category: 'Mathematics',
    name: 'Number Rods',
    ageGroup: 'Early Childhood',
    displayOrder: 1,
    notes: 'Understand quantity 1-10',
  },
  {
    category: 'Mathematics',
    name: 'Sandpaper Numbers',
    ageGroup: 'Early Childhood',
    displayOrder: 2,
    notes: 'Trace and recognize numerals 0-9',
  },
  {
    category: 'Mathematics',
    name: 'Spindle Box',
    ageGroup: 'Early Childhood',
    displayOrder: 3,
    notes: 'Associate quantity with numeral',
  },
  {
    category: 'Mathematics',
    name: 'Golden Beads',
    ageGroup: 'Early Childhood',
    displayOrder: 4,
    notes: 'Introduction to decimal system',
  },
  {
    category: 'Culture',
    name: 'Land and Water Forms',
    ageGroup: 'Early Childhood',
    displayOrder: 1,
    notes: 'Recognize geographic landforms',
  },
  {
    category: 'Culture',
    name: 'Puzzle Maps',
    ageGroup: 'Early Childhood',
    displayOrder: 2,
    notes: 'Identify continents',
  },
  {
    category: 'Culture',
    name: 'Botany Cabinet',
    ageGroup: 'Early Childhood',
    displayOrder: 3,
    notes: 'Learn leaf shapes',
  },
  {
    category: 'Culture',
    name: 'Zoology Puzzles',
    ageGroup: 'Early Childhood',
    displayOrder: 4,
    notes: 'Study animal parts',
  },
  {
    category: 'Language',
    name: 'Sandpaper Letters',
    ageGroup: 'Early Childhood',
    displayOrder: 1,
    notes: 'Learn letter sounds',
  },
  {
    category: 'Language',
    name: 'Moveable Alphabet',
    ageGroup: 'Early Childhood',
    displayOrder: 2,
    notes: 'Build simple words',
  },
  {
    category: 'Language',
    name: 'Object Box',
    ageGroup: 'Early Childhood',
    displayOrder: 3,
    notes: 'Match objects to words',
  },
  {
    category: 'Language',
    name: 'Reading Classification',
    ageGroup: 'Early Childhood',
    displayOrder: 4,
    notes: 'Read and classify words',
  },
  {
    category: 'Practical Life',
    name: 'Community Building',
    ageGroup: 'Lower Elementary',
    displayOrder: 1,
    notes: 'Organize class meetings',
  },
  {
    category: 'Practical Life',
    name: 'Time Management',
    ageGroup: 'Lower Elementary',
    displayOrder: 2,
    notes: 'Plan daily work presentation',
  },
  {
    category: 'Practical Life',
    name: 'Research Skills',
    ageGroup: 'Lower Elementary',
    displayOrder: 3,
    notes: 'Use reference materials',
  },
  {
    category: 'Sensorial',
    name: 'Geometric Solids',
    ageGroup: 'Lower Elementary',
    displayOrder: 1,
    notes: 'Identify 3D shapes',
  },
  {
    category: 'Sensorial',
    name: 'Sensorial Extensions',
    ageGroup: 'Lower Elementary',
    displayOrder: 2,
    notes: 'Advanced sensorial discrimination',
  },
  {
    category: 'Mathematics',
    name: 'Multiplication Board',
    ageGroup: 'Lower Elementary',
    displayOrder: 1,
    notes: 'Memorize multiplication facts',
  },
  {
    category: 'Mathematics',
    name: 'Division Board',
    ageGroup: 'Lower Elementary',
    displayOrder: 2,
    notes: 'Understand division concept',
  },
  {
    category: 'Mathematics',
    name: 'Fraction Circles',
    ageGroup: 'Lower Elementary',
    displayOrder: 3,
    notes: 'Introduction to fractions',
  },
  {
    category: 'Mathematics',
    name: 'Decimal Board',
    ageGroup: 'Lower Elementary',
    displayOrder: 4,
    notes: 'Work with decimal numbers',
  },
  {
    category: 'Culture',
    name: 'Timeline of Life',
    ageGroup: 'Lower Elementary',
    displayOrder: 1,
    notes: 'Study evolution of life',
  },
  {
    category: 'Culture',
    name: 'Parts of Plants',
    ageGroup: 'Lower Elementary',
    displayOrder: 2,
    notes: 'Detailed plant anatomy',
  },
  {
    category: 'Culture',
    name: 'Solar System',
    ageGroup: 'Lower Elementary',
    displayOrder: 3,
    notes: 'Learn planets and their properties',
  },
  {
    category: 'Culture',
    name: 'Ancient Civilizations',
    ageGroup: 'Lower Elementary',
    displayOrder: 4,
    notes: 'Study early human societies',
  },
  {
    category: 'Language',
    name: 'Word Study',
    ageGroup: 'Lower Elementary',
    displayOrder: 1,
    notes: 'Analyze word structure',
  },
  {
    category: 'Language',
    name: 'Grammar Boxes',
    ageGroup: 'Lower Elementary',
    displayOrder: 2,
    notes: 'Study parts of speech',
  },
  {
    category: 'Language',
    name: 'Sentence Analysis',
    ageGroup: 'Lower Elementary',
    displayOrder: 3,
    notes: 'Diagram sentences',
  },
  {
    category: 'Language',
    name: 'Reading Comprehension',
    ageGroup: 'Lower Elementary',
    displayOrder: 4,
    notes: 'Analyze texts for meaning',
  },
  {
    category: 'Practical Life',
    name: 'Project Management',
    ageGroup: 'Upper Elementary',
    displayOrder: 1,
    notes: 'Plan and execute long-term projects',
  },
  {
    category: 'Practical Life',
    name: 'Leadership Skills',
    ageGroup: 'Upper Elementary',
    displayOrder: 2,
    notes: 'Lead group activities',
  },
  {
    category: 'Practical Life',
    name: 'Business Basics',
    ageGroup: 'Upper Elementary',
    displayOrder: 3,
    notes: 'Understand micro-economy',
  },
  {
    category: 'Sensorial',
    name: 'Advanced Measurement',
    ageGroup: 'Upper Elementary',
    displayOrder: 1,
    notes: 'Precise measurement and estimation',
  },
  {
    category: 'Sensorial',
    name: 'Scientific Observation',
    ageGroup: 'Upper Elementary',
    displayOrder: 2,
    notes: 'Detailed observation and recording',
  },
  {
    category: 'Mathematics',
    name: 'Algebraic Thinking',
    ageGroup: 'Upper Elementary',
    displayOrder: 1,
    notes: 'Introduction to variables',
  },
  {
    category: 'Mathematics',
    name: 'Geometric Theorems',
    ageGroup: 'Upper Elementary',
    displayOrder: 2,
    notes: 'Understand basic proofs',
  },
  {
    category: 'Mathematics',
    name: 'Ratio and Proportion',
    ageGroup: 'Upper Elementary',
    displayOrder: 3,
    notes: 'Solve ratio problems',
  },
  {
    category: 'Mathematics',
    name: 'Statistical Analysis',
    ageGroup: 'Upper Elementary',
    displayOrder: 4,
    notes: 'Collect and interpret data',
  },
  {
    category: 'Culture',
    name: 'World Geography',
    ageGroup: 'Upper Elementary',
    displayOrder: 1,
    notes: 'Study political and physical geography',
  },
  {
    category: 'Culture',
    name: 'Chemistry Basics',
    ageGroup: 'Upper Elementary',
    displayOrder: 2,
    notes: 'Understand atomic structure',
  },
  {
    category: 'Culture',
    name: 'Human Body Systems',
    ageGroup: 'Upper Elementary',
    displayOrder: 3,
    notes: 'Study anatomy and physiology',
  },
  {
    category: 'Culture',
    name: 'World History',
    ageGroup: 'Upper Elementary',
    displayOrder: 4,
    notes: 'Explore major historical events',
  },
  {
    category: 'Language',
    name: 'Literary Analysis',
    ageGroup: 'Upper Elementary',
    displayOrder: 1,
    notes: 'Analyze themes and symbolism',
  },
  {
    category: 'Language',
    name: 'Research Papers',
    ageGroup: 'Upper Elementary',
    displayOrder: 2,
    notes: 'Write documented research',
  },
  {
    category: 'Language',
    name: 'Public Speaking',
    ageGroup: 'Upper Elementary',
    displayOrder: 3,
    notes: 'Prepare and deliver presentations',
  },
  {
    category: 'Language',
    name: 'Creative Writing',
    ageGroup: 'Upper Elementary',
    displayOrder: 4,
    notes: 'Develop original narratives',
  },
  {
    category: 'Practical Life',
    name: 'Entrepreneurship',
    ageGroup: 'Middle School',
    displayOrder: 1,
    notes: 'Develop business plan',
  },
  {
    category: 'Practical Life',
    name: 'Community Service',
    ageGroup: 'Middle School',
    displayOrder: 2,
    notes: 'Organize service projects',
  },
  {
    category: 'Practical Life',
    name: 'Career Exploration',
    ageGroup: 'Middle School',
    displayOrder: 3,
    notes: 'Research career paths',
  },
  {
    category: 'Sensorial',
    name: 'Design Thinking',
    ageGroup: 'Middle School',
    displayOrder: 1,
    notes: 'Apply design process to problems',
  },
  {
    category: 'Sensorial',
    name: 'Aesthetic Appreciation',
    ageGroup: 'Middle School',
    displayOrder: 2,
    notes: 'Analyze art and design',
  },
  {
    category: 'Mathematics',
    name: 'Algebra I',
    ageGroup: 'Middle School',
    displayOrder: 1,
    notes: 'Solve linear equations',
  },
  {
    category: 'Mathematics',
    name: 'Geometry',
    ageGroup: 'Middle School',
    displayOrder: 2,
    notes: 'Geometric proofs and theorems',
  },
  {
    category: 'Mathematics',
    name: 'Pre-Calculus Concepts',
    ageGroup: 'Middle School',
    displayOrder: 3,
    notes: 'Introduction to functions',
  },
  {
    category: 'Mathematics',
    name: 'Applied Mathematics',
    ageGroup: 'Middle School',
    displayOrder: 4,
    notes: 'Use math in real-world contexts',
  },
  {
    category: 'Culture',
    name: 'Global Issues',
    ageGroup: 'Middle School',
    displayOrder: 1,
    notes: 'Study contemporary world challenges',
  },
  {
    category: 'Culture',
    name: 'Environmental Science',
    ageGroup: 'Middle School',
    displayOrder: 2,
    notes: 'Understand ecosystems and conservation',
  },
  {
    category: 'Culture',
    name: 'Physics Principles',
    ageGroup: 'Middle School',
    displayOrder: 3,
    notes: 'Study motion, energy, and forces',
  },
  {
    category: 'Culture',
    name: 'Cultural Anthropology',
    ageGroup: 'Middle School',
    displayOrder: 4,
    notes: 'Compare human cultures',
  },
  {
    category: 'Language',
    name: 'Advanced Composition',
    ageGroup: 'Middle School',
    displayOrder: 1,
    notes: 'Write argumentative essays',
  },
  {
    category: 'Language',
    name: 'World Literature',
    ageGroup: 'Middle School',
    displayOrder: 2,
    notes: 'Study global literary traditions',
  },
  {
    category: 'Language',
    name: 'Debate and Rhetoric',
    ageGroup: 'Middle School',
    displayOrder: 3,
    notes: 'Construct logical arguments',
  },
  {
    category: 'Language',
    name: 'Media Literacy',
    ageGroup: 'Middle School',
    displayOrder: 4,
    notes: 'Analyze media messages critically',
  },
];

const childParentAssignments = {
  Jakub: 'petr.novak@example.com',
  Ema: 'lucie.dvorakova@example.com',
  Tereza: 'karel.svoboda@example.com',
  Filip: 'radek.jelinek@example.com',
  Sofie: 'lenka.stankova@example.com',
  Adam: 'michal.rehak@example.com',
  Klara: 'lenka.stankova@example.com',
  Matej: 'radek.jelinek@example.com',
  Nina: 'michal.rehak@example.com',
};

const teacherAssignments = [
  ['Nido - Butterflies', 'jana.kralova@example.com', 'teacher'],
  ['Nido - Butterflies', 'alena.malikova@example.com', 'assistant'],
  ['Nido - Ladybugs', 'martin.novotny@example.com', 'teacher'],
  ['Nido - Ladybugs', 'ondrej.kucera@example.com', 'assistant'],
  ['Toddler - Caterpillars', 'eva.svobodova@example.com', 'teacher'],
  ['Toddler - Caterpillars', 'lucas.prochazka@example.com', 'assistant'],
  ['Toddler - Fireflies', 'simona.havlova@example.com', 'teacher'],
  ['Toddler - Fireflies', 'petr.horak@example.com', 'assistant'],
  ['Early Childhood - Sunflowers', 'klara.benesova@example.com', 'teacher'],
  ['Early Childhood - Sunflowers', 'daniel.kolar@example.com', 'assistant'],
  ['Early Childhood - Bumblebees', 'martina.vackova@example.com', 'teacher'],
  ['Early Childhood - Bumblebees', 'veronika.krizova@example.com', 'assistant'],
  ['Early Childhood - Daisies', 'tomas.novak@example.com', 'teacher'],
  ['Early Childhood - Daisies', 'katerina.cerna@example.com', 'assistant'],
  ['Lower Elementary - Explorers', 'jakub.dvorak@example.com', 'teacher'],
  ['Lower Elementary - Explorers', 'petra.holubova@example.com', 'assistant'],
  ['Lower Elementary - Inventors', 'milan.pesek@example.com', 'teacher'],
  ['Lower Elementary - Inventors', 'zuzana.bartova@example.com', 'assistant'],
  ['Lower Elementary - Discoverers', 'david.maly@example.com', 'teacher'],
  ['Lower Elementary - Discoverers', 'lenka.novotna@example.com', 'assistant'],
  ['Upper Elementary - Trailblazers', 'michal.cerny@example.com', 'teacher'],
  ['Upper Elementary - Trailblazers', 'hana.pokorova@example.com', 'assistant'],
  ['Upper Elementary - Navigators', 'pavel.vesely@example.com', 'teacher'],
  ['Upper Elementary - Navigators', 'barbora.mrazova@example.com', 'assistant'],
  ['Upper Elementary - Pioneers', 'jan.svoboda@example.com', 'teacher'],
  ['Upper Elementary - Pioneers', 'tereza.adamova@example.com', 'assistant'],
  ['Middle School - Scholars', 'lukas.nemec@example.com', 'teacher'],
  ['Middle School - Scholars', 'anna.vlkova@example.com', 'assistant'],
  ['Middle School - Innovators', 'radek.moravec@example.com', 'teacher'],
  ['Middle School - Innovators', 'ivana.fiala@example.com', 'assistant'],
];

const attendancePlans = [
  { dayOffset: 0, checkInTime: '08:55', checkOutTime: '15:05', notes: 'On time' },
  { dayOffset: 0, checkInTime: '09:20', checkOutTime: '15:10', notes: 'Late arrival - traffic' },
  { dayOffset: -1, checkInTime: '08:45', checkOutTime: '14:50', notes: 'On time' },
  {
    dayOffset: -1,
    checkInTime: '09:30',
    checkOutTime: '15:00',
    notes: 'Late arrival - appointment',
  },
];

const todayIsoDate = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const combineDateTime = (dateValue, timeValue) => new Date(`${dateValue}T${timeValue}:00`);

const calculateAge = (dateOfBirth) => {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDifference = today.getMonth() + 1 - month;

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < day)) {
    age -= 1;
  }

  return age;
};

const mapBy = (rows, key) => new Map(rows.map((row) => [row[key], row]));

const seedAlreadyExists = async () => {
  const result = await pool.query(
    "select exists (select 1 from users where email = 'admin@example.com') as seeded"
  );

  return !!result.rows[0]?.seeded;
};

async function seed() {
  try {
    if (await seedAlreadyExists()) {
      console.log('ℹ️  Existing seed data detected; skipping seed run');
      return;
    }

    await db.transaction(async (tx) => {
      await tx.insert(users).values(userSeedRows).onConflictDoNothing();
      await tx.insert(children).values(childSeedRows).onConflictDoNothing();
      await tx.insert(classes).values(classSeedRows).onConflictDoNothing();
      await tx
        .insert(categoryPresentations)
        .values(categoryPresentationSeedRows)
        .onConflictDoNothing();

      const seededUsers = await tx
        .select({ id: users.id, email: users.email, role: users.role })
        .from(users)
        .where(
          inArray(
            users.email,
            userSeedRows.map((row) => row.email)
          )
        );

      const seededChildren = await tx
        .select({
          id: children.id,
          firstname: children.firstname,
          surname: children.surname,
          dateOfBirth: children.dateOfBirth,
        })
        .from(children)
        .where(
          inArray(
            children.firstname,
            childSeedRows.map((row) => row.firstname)
          )
        );

      const seededClasses = await tx
        .select({
          id: classes.id,
          name: classes.name,
          ageGroup: classes.ageGroup,
          minAge: classes.minAge,
          maxAge: classes.maxAge,
        })
        .from(classes)
        .where(
          inArray(
            classes.name,
            classSeedRows.map((row) => row.name)
          )
        );

      const userMap = mapBy(seededUsers, 'email');
      const classMap = mapBy(seededClasses, 'name');

      const childParentRows = Object.entries(childParentAssignments).map(
        ([childFirstname, parentEmail]) => {
          const childRecord = seededChildren.find((row) => row.firstname === childFirstname);
          return {
            childId: childRecord.id,
            parentId: userMap.get(parentEmail).id,
          };
        }
      );
      await tx.insert(childParents).values(childParentRows).onConflictDoNothing();

      const classTeacherRows = teacherAssignments.map(([className, teacherEmail, role]) => ({
        classId: classMap.get(className).id,
        teacherId: userMap.get(teacherEmail).id,
        role,
      }));
      await tx.insert(classTeachers).values(classTeacherRows).onConflictDoNothing();

      const classChildrenRows = seededChildren.map((child) => {
        const age = calculateAge(child.dateOfBirth);
        const matchingClass = seededClasses
          .filter((currentClass) => age >= currentClass.minAge && age <= currentClass.maxAge)
          .sort(
            (left, right) =>
              left.minAge - right.minAge ||
              left.maxAge - right.maxAge ||
              left.name.localeCompare(right.name)
          )[0];

        return {
          classId: matchingClass.id,
          childId: child.id,
        };
      });
      await tx.insert(classChildren).values(classChildrenRows).onConflictDoNothing();

      const childClassRows = await tx
        .select({ childId: classChildren.childId, classId: classChildren.classId })
        .from(classChildren);

      const presentationsRows = childClassRows.flatMap(({ childId, classId }) => {
        const classRecord = seededClasses.find((row) => row.id === classId);
        return categoryPresentationSeedRows
          .filter((template) => template.ageGroup === classRecord.ageGroup)
          .map((template) => ({
            childId,
            classId,
            name: template.name,
            category: template.category,
            displayOrder: template.displayOrder,
            status: template.displayOrder === 1 ? 'to be presented' : 'prerequisites not met',
            notes: template.notes,
            createdBy: userMap.get('admin@example.com').id,
          }));
      });
      await tx.insert(presentations).values(presentationsRows).onConflictDoNothing();

      const attendanceRows = childClassRows.flatMap(({ childId, classId }) =>
        attendancePlans.map((plan) => {
          const attendanceDate = todayIsoDate(plan.dayOffset);
          return {
            classId,
            childId,
            attendanceDate,
            checkInAt: combineDateTime(attendanceDate, plan.checkInTime),
            checkOutAt: combineDateTime(attendanceDate, plan.checkOutTime),
            checkedInBy: userMap.get('admin@example.com').id,
            checkedOutBy: userMap.get('admin@example.com').id,
            notes: plan.notes,
          };
        })
      );
      await tx.insert(classAttendance).values(attendanceRows).onConflictDoNothing();
    });

    console.log('✅ Database seeded successfully');
  } finally {
    await closePool();
  }
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
