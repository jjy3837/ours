import { getDb } from './db.js';
import { CATEGORIES } from './config.js';

const SELECT_FIELDS = 'id, category, content, created_at';

export async function createAdvice(category, content) {
  const db = await getDb();
  const { lastInsertRowid } = await db.run(
    'INSERT INTO advices (category, content) VALUES (?, ?)',
    [category, content]
  );

  return db.get(`SELECT ${SELECT_FIELDS} FROM advices WHERE id = ?`, [lastInsertRowid]);
}

/**
 * 카테고리 내 랜덤 1건. excludeId를 주면 그 글을 뺀 나머지에서 먼저 찾고,
 * 다른 글이 없으면 같은 글이라도 돌려준다(글이 1건뿐인 카테고리 대응).
 */
export async function findRandomByCategory(category, excludeId = null) {
  const db = await getDb();

  if (excludeId != null) {
    const other = await db.get(
      `SELECT ${SELECT_FIELDS} FROM advices
       WHERE category = ? AND id != ?
       ORDER BY RANDOM() LIMIT 1`,
      [category, excludeId]
    );
    if (other) return other;
  }

  return db.get(
    `SELECT ${SELECT_FIELDS} FROM advices
     WHERE category = ?
     ORDER BY RANDOM() LIMIT 1`,
    [category]
  );
}

export async function countByCategory(category) {
  const db = await getDb();
  const row = await db.get('SELECT COUNT(*) AS count FROM advices WHERE category = ?', [
    category,
  ]);
  return row?.count ?? 0;
}

export async function countAllCategories() {
  const db = await getDb();
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));

  for (const row of await db.all(
    'SELECT category, COUNT(*) AS count FROM advices GROUP BY category'
  )) {
    counts[row.category] = row.count;
  }

  return counts;
}
