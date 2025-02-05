CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');

DROP TABLE IF EXISTS users, children CASCADE;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    role user_role NOT NULL
);

CREATE TABLE children (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    parent_id INTEGER NOT NULL REFERENCES users(id),
    contact VARCHAR(50) NOT NULL,
    notes TEXT
);

CREATE TABLE invitations (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    token VARCHAR(100) UNIQUE NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Insert admin and parent users
INSERT INTO users (email, firstname, surname, password, role) VALUES
('admin@example.com', 'Admin', 'Admin', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'admin'),
('petr.novak@example.com', 'Petr', 'Novák', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'parent'),
('lucie.dvorakova@example.com', 'Lucie', 'Dvořáková', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'parent'),
('karel.svoboda@example.com', 'Karel', 'Svoboda', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'parent')
ON CONFLICT (email) DO NOTHING;

-- Insert children with correct parent_id references and proper date casting
INSERT INTO children (firstname, surname, date_of_birth, parent_id, contact, notes)
SELECT 
    'Jakub', 'Novák', DATE '2018-01-01', u.id, 'petr.novak@example.com', 'Alergie na ořechy'
FROM users u WHERE u.email = 'petr.novak@example.com'
UNION ALL
SELECT 
    'Ema', 'Dvořáková', DATE '2019-01-01', u.id, 'lucie.dvorakova@example.com', 'Bez speciálních požadavků'
FROM users u WHERE u.email = 'lucie.dvorakova@example.com'
UNION ALL
SELECT 
    'Tereza', 'Svobodová', DATE '2017-01-01', u.id, 'karel.svoboda@example.com', 'Vegetariánská strava'
FROM users u WHERE u.email = 'karel.svoboda@example.com';
