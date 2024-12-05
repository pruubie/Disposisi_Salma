-- Create the database
CREATE DATABASE IF NOT EXISTS permohonan_surat;
USE permohonan_surat;

-- Table: users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nim VARCHAR(15) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('mahasiswa', 'tendik') NOT NULL
);

-- Table: surat
CREATE TABLE surat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nim VARCHAR(15) NOT NULL,
    jenis_surat VARCHAR(50) NOT NULL,
    lampiran TEXT NOT NULL,
    status ENUM('verifikator', 'supervisor', 'manajer', 'wd', 'dekan', 'completed') DEFAULT 'verifikator',
    document_path TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (nim) REFERENCES users(nim) ON DELETE CASCADE
);

-- Insert sample users (default password: nim hashed)
-- Replace <hashed_password> with actual bcrypt hashes

INSERT INTO users (nim, password, role) VALUES
('21120122130075', '$2b$10$hashed_password_for_mahasiswa1', 'mahasiswa'),
('21120122130076', '$2b$10$hashed_password_for_mahasiswa2', 'mahasiswa'),
('19900122120001', '$2b$10$hashed_password_for_tendik1', 'tendik');

-- Sample bcrypt hash for testing (replace with actual bcrypt hashing)
-- $2b$10$hashed_password_for_mahasiswa1 -> hash of "21120122130075"
-- $2b$10$hashed_password_for_mahasiswa2 -> hash of "21120122130076"
-- $2b$10$hashed_password_for_tendik1    -> hash of "19900122120001"

-- Insert sample surat data
INSERT INTO surat (nim, jenis_surat, lampiran, status) VALUES
('21120122130075', 'Permohonan Data Penelitian', 'Lampiran 1', 'verifikator'),
('21120122130076', 'Permohonan Kerja Praktek', 'Lampiran 2', 'supervisor');

