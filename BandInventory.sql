DROP DATABASE IF EXISTS BandInventory;
CREATE DATABASE BandInventory;
USE BandInventory;


CREATE TABLE Roster (
student_id INT unsigned NOT NULL auto_increment PRIMARY KEY,
full_name VARCHAR(150) NOT NULL,
graduation_year YEAR NOT NULL,
instrument_played VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE Uniforms (
uniform_id INT UNSIGNED NOT NULL auto_increment PRIMARY KEY,
item_type VARCHAR(50) NOT NULL,
item_number VARCHAR(10),
size VARCHAR(10),
status VARCHAR(50) NOT NULL DEFAULT 'Available'
) ENGINE=InnoDB;

CREATE TABLE Instruments (
instrument_id INT UNSIGNED NOT NULL auto_increment PRIMARY KEY,
instrument_name VARCHAR(100) NOT NULL,
instrument_number VARCHAR(50) NOT NULL,
locker_number VARCHAR(20) NOT NULL,
locker_code VARCHAR(20) NOT NULL,
condition_notes TEXT
) ENGINE=InnoDB;

CREATE TABLE Assignments (
assignment_id INT UNSIGNED NOT NULL auto_increment PRIMARY KEY,
student_fk INT UNSIGNED NOT NULL,
uniform_fk INT UNSIGNED NULL,
instrument_fk INT UNSIGNED NULL,
date_out DATE NOT NULL,
date_in DATE NULL,

FOREIGN KEY (student_fk) REFERENCES Roster(student_id)
	ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (uniform_fk) REFERENCES Uniforms(uniform_id)
	ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY (instrument_fk) REFERENCES Instruments(instrument_id)
	ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;