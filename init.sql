-- init.sql

CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    role VARCHAR(50) NOT NULL
);

-- Додаємо вашого користувача. Замініть ID, якщо потрібно.
INSERT INTO users (id, name, role) VALUES ('7350287247', 'Tapgan', 'admin');