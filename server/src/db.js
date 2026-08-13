/**
 * 두 가지 저장소를 같은 인터페이스로 감싼다.
 *
 *   - 로컬 개발: Node 내장 node:sqlite (파일 DB, 설치할 것 없음)
 *   - 배포:      Turso(libSQL) HTTP 클라이언트 (무료 플랜에서도 데이터 영구 보존)
 *
 * TURSO_DATABASE_URL이 있으면 Turso, 없으면 로컬 파일을 쓴다.
 * libSQL이 비동기이므로 인터페이스는 전부 Promise 기반이다.
 */
import './env.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES } from './config.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

/**
 * Turso Cloud는 엔진이 두 종류이고 드라이버가 서로 호환되지 않는다.
 *   libsql → 기존 libSQL 엔진 (@libsql/client)
 *   turso  → 신규 Turso 엔진 (@tursodatabase/serverless)
 * 대시보드에서 만든 DB 종류에 맞춰 TURSO_DRIVER로 고른다.
 */
export const TURSO_DRIVER = process.env.TURSO_DRIVER === 'turso' ? 'turso' : 'libsql';

export const usingTurso = Boolean(TURSO_URL);

export const DB_PATH = usingTurso
  ? TURSO_URL
  : process.env.DB_PATH || path.resolve(currentDir, '../data/advices.db');

/** integer 컬럼이 BigInt로 올 수 있어 JSON 직렬화 전에 number로 맞춘다. */
function normalizeRow(row) {
  if (!row) return row;
  const result = {};
  for (const [key, value] of Object.entries(row)) {
    result[key] = typeof value === 'bigint' ? Number(value) : value;
  }
  return result;
}

async function createTursoAdapter() {
  const { createClient } =
    TURSO_DRIVER === 'turso'
      ? await import('@tursodatabase/serverless/compat')
      : await import('@libsql/client/web');

  const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  // libSQL Row는 이름과 인덱스 접근을 함께 지원해서, columns로 명시적으로 매핑한다.
  async function all(sql, args = []) {
    const { columns, rows } = await client.execute({ sql, args });
    return rows.map((row) => {
      const record = {};
      columns.forEach((column, index) => {
        const value = row[index];
        record[column] = typeof value === 'bigint' ? Number(value) : value;
      });
      return record;
    });
  }

  return {
    all,
    async get(sql, args = []) {
      const rows = await all(sql, args);
      return rows[0] ?? null;
    },
    async run(sql, args = []) {
      const result = await client.execute({ sql, args });
      return {
        changes: Number(result.rowsAffected ?? 0),
        lastInsertRowid: Number(result.lastInsertRowid ?? 0),
      };
    },
    async exec(sql) {
      await client.executeMultiple(sql);
    },
    async batch(statements) {
      await client.batch(statements, 'write');
    },
    async close() {
      client.close();
    },
  };
}

async function createLocalAdapter() {
  const { DatabaseSync } = await import('node:sqlite');

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);

  return {
    async all(sql, args = []) {
      return db.prepare(sql).all(...args).map(normalizeRow);
    },
    async get(sql, args = []) {
      return normalizeRow(db.prepare(sql).get(...args)) ?? null;
    },
    async run(sql, args = []) {
      const result = db.prepare(sql).run(...args);
      return {
        changes: Number(result.changes),
        lastInsertRowid: Number(result.lastInsertRowid),
      };
    },
    async exec(sql) {
      db.exec(sql);
    },
    async batch(statements) {
      db.exec('BEGIN');
      try {
        for (const { sql, args = [] } of statements) {
          db.prepare(sql).run(...args);
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    async close() {
      db.close();
    },
  };
}

let adapter = null;

export async function getDb() {
  if (!adapter) {
    adapter = usingTurso ? await createTursoAdapter() : await createLocalAdapter();
  }
  return adapter;
}

export async function initSchema() {
  const db = await getDb();
  const allowedCategories = CATEGORIES.map((category) => `'${category}'`).join(', ');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS advices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL CHECK (category IN (${allowedCategories})),
      content TEXT NOT NULL CHECK (length(trim(content)) > 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_advices_category ON advices (category);
  `);

  return db;
}

export async function closeDb() {
  if (adapter) {
    await adapter.close();
    adapter = null;
  }
}
