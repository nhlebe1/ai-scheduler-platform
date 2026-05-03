import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'bookings.db');

let db: Database;

function persist() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

export async function initDb(): Promise<void> {
  const SQL = await initSqlJs();
  db = fs.existsSync(DB_PATH)
    ? new SQL.Database(fs.readFileSync(DB_PATH))
    : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id   TEXT NOT NULL,
      name        TEXT NOT NULL,
      phone       TEXT NOT NULL,
      email       TEXT NOT NULL,
      service     TEXT NOT NULL,
      address     TEXT NOT NULL,
      slot        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'New',
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Migration: add status column to existing databases that predate this field
  try {
    db.run("ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'New'");
  } catch (_e) {
    // Column already exists — expected on fresh DBs, safe to ignore
  }

  persist();
}

// Helper: return all rows as plain objects
export function queryAll(sql: string, params: (string | number | null)[] = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject() as Record<string, unknown>);
  stmt.free();
  return rows;
}

// Helper: run a write statement, return last inserted rowid, then persist.
// NOTE: db.export() (called inside persist) resets last_insert_rowid to 0,
// so we must read the rowid before persisting.
export function runWrite(sql: string, params: (string | number | null)[] = []): number {
  db.run(sql, params);
  const result = db.exec('SELECT last_insert_rowid() AS id');
  const newId = result[0]?.values[0][0] as number;
  persist();
  return newId;
}
