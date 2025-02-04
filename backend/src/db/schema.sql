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
    parent_name VARCHAR(100) NOT NULL,
    contact VARCHAR(50) NOT NULL,
    notes TEXT
);

INSERT INTO users (email, firstname, surname, password, role) VALUES
('admin@example.com', 'Admin', 'Admin', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO children (firstname, surname, date_of_birth, parent_name, contact, notes) VALUES
('Jakub', 'Novák', '2018-01-01', 'Petr Novák', 'petr.novak@example.com', 'Alergie na ořechy'),
('Ema', 'Dvořáková', '2019-01-01', 'Lucie Dvořáková', 'lucie.dvorakova@example.com', 'Bez speciálních požadavků'),
('Tereza', 'Svobodová', '2017-01-01', 'Karel Svoboda', 'karel.svoboda@example.com', 'Vegetariánská strava');
