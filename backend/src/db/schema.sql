CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL
);

CREATE TABLE children (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    parent_name VARCHAR(100) NOT NULL,
    contact VARCHAR(50) NOT NULL,
    notes TEXT
);

INSERT INTO users (email, password, role) VALUES
('admin@example.com', '$2b$10$ZqFhH0wzC/sdfh34g98H8O7j1yGm5gQVpWFX9z3GkzMYBR1tFaG', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO children (name, age, parent_name, contact, notes) VALUES
('Jakub Novák', 5, 'Petr Novák', 'petr.novak@example.com', 'Alergie na ořechy'),
('Ema Dvořáková', 4, 'Lucie Dvořáková', 'lucie.dvorakova@example.com', 'Bez speciálních požadavků'),
('Tereza Svobodová', 6, 'Karel Svoboda', 'karel.svoboda@example.com', 'Vegetariánská strava'),
('Tereza Svobodová', 6, 'Karel Svoboda', 'karel.svoboda@example.com', 'Vsaddsa')
