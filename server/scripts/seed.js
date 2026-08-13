/**
 * advices 테이블 시딩 스크립트
 *
 *   npm run seed              중복(동일 content)은 건너뛰고 새 항목만 추가
 *   npm run seed:reset        기존 데이터를 모두 지우고 처음부터 다시 시딩
 *   node scripts/seed.js --file ./data/other.json
 *
 * TURSO_DATABASE_URL이 설정되어 있으면 Turso에, 없으면 로컬 SQLite 파일에 시딩한다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeDb, DB_PATH, initSchema, usingTurso } from '../src/db.js';
import { CATEGORIES, MIN_CONTENT_LENGTH } from '../src/config.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const fileIndex = argv.indexOf('--file');
  return {
    reset: argv.includes('--reset'),
    file:
      fileIndex !== -1 && argv[fileIndex + 1]
        ? path.resolve(process.cwd(), argv[fileIndex + 1])
        : path.resolve(currentDir, '../data/seed_data.json'),
  };
}

function readSeedFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`시드 파일을 찾을 수 없습니다: ${filePath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!Array.isArray(parsed)) {
    throw new Error('시드 파일은 { category, content } 객체의 배열이어야 합니다.');
  }

  return parsed;
}

/** 잘못된 행은 전체를 중단시키지 않고 걸러내며, 사유를 함께 돌려준다. */
function validate(rows) {
  const valid = [];
  const invalid = [];
  const warnings = [];

  rows.forEach((row, index) => {
    const position = `${index + 1}번째 항목`;

    if (!row || typeof row !== 'object') {
      invalid.push(`${position}: 객체가 아닙니다.`);
      return;
    }

    const { category, content } = row;

    if (!CATEGORIES.includes(category)) {
      invalid.push(`${position}: 알 수 없는 category "${category}"`);
      return;
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      invalid.push(`${position}: content가 비어 있습니다.`);
      return;
    }

    const trimmed = content.trim();

    // 10자 제한은 사용자 입력에만 적용하는 규칙이라 시딩은 통과시키고 알리기만 한다.
    if (trimmed.length < MIN_CONTENT_LENGTH) {
      warnings.push(`${position}: ${trimmed.length}자로 짧습니다 — "${trimmed}"`);
    }

    valid.push({ category, content: trimmed });
  });

  return { valid, invalid, warnings };
}

async function main() {
  const { reset, file } = parseArgs(process.argv.slice(2));

  console.log(`[seed] 대상: ${usingTurso ? 'Turso' : '로컬 SQLite'}`);
  console.log(`[seed] DB   : ${DB_PATH}`);
  console.log(`[seed] 시드 : ${file}`);

  const db = await initSchema();
  const { valid, invalid, warnings } = validate(readSeedFile(file));

  for (const warning of warnings) console.warn(`[seed] 경고 ${warning}`);
  for (const message of invalid) console.error(`[seed] 제외 ${message}`);

  const statements = [];

  if (reset) {
    statements.push({ sql: 'DELETE FROM advices', args: [] });
    statements.push({ sql: "DELETE FROM sqlite_sequence WHERE name = 'advices'", args: [] });
  }

  const existingContents = reset
    ? new Set()
    : new Set((await db.all('SELECT content FROM advices')).map((row) => row.content));

  let inserted = 0;
  let skipped = 0;

  for (const { category, content } of valid) {
    if (existingContents.has(content)) {
      skipped += 1;
      continue;
    }
    statements.push({
      sql: 'INSERT INTO advices (category, content) VALUES (?, ?)',
      args: [category, content],
    });
    existingContents.add(content);
    inserted += 1;
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }

  if (reset) console.log('[seed] --reset: 기존 데이터를 모두 삭제하고 다시 넣었습니다.');

  console.log(`\n[seed] 추가 ${inserted}건 / 중복 건너뜀 ${skipped}건 / 제외 ${invalid.length}건`);
  console.log('[seed] 카테고리별 현재 개수');

  const counts = await db.all(
    'SELECT category, COUNT(*) AS count FROM advices GROUP BY category'
  );
  const countByCategory = Object.fromEntries(counts.map((row) => [row.category, row.count]));

  for (const category of CATEGORIES) {
    console.log(`  - ${category}: ${countByCategory[category] ?? 0}건`);
  }

  const total = await db.get('SELECT COUNT(*) AS count FROM advices');
  console.log(`  = 합계: ${total.count}건`);
}

try {
  await main();
} catch (error) {
  console.error(`[seed] 실패: ${error.message}`);
  process.exitCode = 1;
} finally {
  await closeDb();
}
