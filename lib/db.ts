import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const DB_PATH = process.env.VERCEL
     ? path.join("/tmp", "hotel.db")
     : path.join(process.cwd(), "data", "hotel.db");

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff', -- 'staff' | 'manager'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS room_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_per_night REAL NOT NULL,
  capacity INTEGER NOT NULL,
  total_rooms INTEGER NOT NULL,
  image_seed TEXT
);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  confirmation_code TEXT NOT NULL UNIQUE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  room_type_id INTEGER NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | checked_in | checked_out | cancelled
  special_requests TEXT,
  total_price REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

CREATE TABLE IF NOT EXISTS mail_thread (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id INTEGER,
  guest_email TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE TABLE IF NOT EXISTS mail_message (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  sender TEXT NOT NULL, -- 'guest' | 'concierge'
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (thread_id) REFERENCES mail_thread(id)
);
`);

// Seed room types once
const roomCount = db.prepare("SELECT COUNT(*) as c FROM room_types").get() as { c: number };
if (roomCount.c === 0) {
  const insert = db.prepare(
    `INSERT INTO room_types (name, description, price_per_night, capacity, total_rooms, image_seed) VALUES (?, ?, ?, ?, ?, ?)`
  );
  insert.run(
    "Standard Room",
    "Cozy room with a queen bed, city view, and all essential comforts for a restful stay.",
    89,
    2,
    12,
    "standard"
  );
  insert.run(
    "Deluxe Room",
    "Spacious room with a king bed, sitting area, and premium linens for extra comfort.",
    149,
    3,
    8,
    "deluxe"
  );
  insert.run(
    "Executive Suite",
    "Our finest suite, featuring a separate living room, panoramic views, and concierge priority.",
    249,
    4,
    4,
    "suite"
  );
}

// Seed a default manager account once
const staffCount = db.prepare("SELECT COUNT(*) as c FROM staff").get() as { c: number };
if (staffCount.c === 0) {
  const hash = bcrypt.hashSync("admin123", 10);
  db.prepare(
    `INSERT INTO staff (name, email, password_hash, role) VALUES (?, ?, ?, ?)`
  ).run("General Manager", "manager@hotel.rp", hash, "manager");
}

export default db;
