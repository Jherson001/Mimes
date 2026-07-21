-- Schema para Aiven / MySQL en la nube (la DB ya existe: defaultdb)
-- No uses CREATE DATABASE ni USE

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  kind ENUM('expense','income') NOT NULL DEFAULT 'expense'
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL DEFAULT 1,
  type ENUM('expense','income') NOT NULL,
  category_id INT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  occurred_at DATE NOT NULL,
  is_recurring TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_month (user_id, occurred_at),
  INDEX idx_type (type),
  CONSTRAINT fk_tx_category FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT IGNORE INTO categories (name, kind) VALUES
  ('Alimentación', 'expense'),
  ('Transporte', 'expense'),
  ('Servicios', 'expense'),
  ('Educación', 'expense'),
  ('Ocio', 'expense'),
  ('Salud', 'expense'),
  ('Vivienda', 'expense'),
  ('Otros', 'expense'),
  ('Sueldo', 'income'),
  ('Otros ingresos', 'income');

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL DEFAULT 1,
  category_id INT NOT NULL,
  month CHAR(7) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  UNIQUE KEY uq_user_cat_month (user_id, category_id, month),
  CONSTRAINT fk_budget_cat FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE CASCADE
);
