-- Visitor Management MVP
-- Run this file once on your MySQL database for the configured DB_NAME.

CREATE TABLE IF NOT EXISTS visitor_types (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_visitor_types_name (name)
);

CREATE TABLE IF NOT EXISTS visitor_entries (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  society_id INT NOT NULL,
  tower_id INT NULL,
  unit_id INT NULL,
  resident_user_id INT NULL,
  visitor_name VARCHAR(120) NOT NULL,
  visitor_phone VARCHAR(20) NOT NULL,
  visitor_type_id INT NULL,
  purpose VARCHAR(255) NULL,
  vehicle_number VARCHAR(40) NULL,
  no_of_visitors INT NOT NULL DEFAULT 1,
  status ENUM('PENDING','APPROVED','REJECTED','CHECKED_IN','CHECKED_OUT') NOT NULL DEFAULT 'PENDING',
  requested_by_guard_id INT NULL,
  approved_by_user_id INT NULL,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME NULL,
  checkin_at DATETIME NULL,
  checkout_at DATETIME NULL,
  rejection_reason VARCHAR(255) NULL,
  remarks VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ve_society (society_id),
  INDEX idx_ve_tower (tower_id),
  INDEX idx_ve_unit (unit_id),
  INDEX idx_ve_resident (resident_user_id),
  INDEX idx_ve_status (status),
  INDEX idx_ve_requested_at (requested_at),
  INDEX idx_ve_type (visitor_type_id)
);

INSERT IGNORE INTO visitor_types (name) VALUES
('Guest'),
('Delivery'),
('Cab Driver'),
('Service Staff'),
('Maid/Cook/Helper'),
('Vendor/Contractor'),
('Society Staff'),
('Emergency');

