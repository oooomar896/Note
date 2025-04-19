CREATE DATABASE hr_system;
USE hr_system;

CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    odoo_id INT
);

CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    check_in DATETIME,
    check_out DATETIME,
    status ENUM('present', 'absent', 'late'),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);
