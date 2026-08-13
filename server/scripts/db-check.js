/**
 * DB 접속 점검 스크립트 — `npm run db:check`
 *
 * .env 또는 환경변수의 접속 정보로 실제 연결해 보고, 스키마와 데이터 개수를 보여준다.
 * 토큰 값 자체는 출력하지 않는다.
 */
import { closeDb, DB_PATH, initSchema, TURSO_DRIVER, usingTurso } from '../src/db.js';
import { CATEGORIES } from '../src/config.js';

function mask(value) {
  if (!value) return '(없음)';
  return `${value.slice(0, 4)}…${value.slice(-4)} (${value.length}자)`;
}

async function main() {
  console.log('--- DB 접속 점검 ---');
  console.log(`대상 : ${usingTurso ? 'Turso (원격, 영구 저장)' : '로컬 SQLite 파일 (임시)'}`);
  console.log(`주소 : ${DB_PATH}`);

  if (usingTurso) {
    const driverPackage =
      TURSO_DRIVER === 'turso' ? '@tursodatabase/serverless' : '@libsql/client';
    console.log(`토큰 : ${mask(process.env.TURSO_AUTH_TOKEN)}`);
    console.log(`드라이버 : ${TURSO_DRIVER} (${driverPackage})`);
  } else {
    console.log('\n※ TURSO_DATABASE_URL이 없어 로컬 파일을 사용합니다.');
    console.log('  Turso에 연결하려면 server/.env.example을 server/.env로 복사한 뒤 값을 채우세요.');
  }

  const db = await initSchema();
  console.log('\n연결 성공. 테이블 준비 완료.');

  const counts = await db.all(
    'SELECT category, COUNT(*) AS count FROM advices GROUP BY category'
  );
  const byCategory = Object.fromEntries(counts.map((row) => [row.category, row.count]));

  console.log('\n카테고리별 개수');
  for (const category of CATEGORIES) {
    console.log(`  - ${category}: ${byCategory[category] ?? 0}건`);
  }

  const total = await db.get('SELECT COUNT(*) AS count FROM advices');
  console.log(`  = 합계: ${total.count}건`);

  if (total.count === 0) {
    console.log('\n비어 있습니다. `npm run seed` 로 시드 24건을 넣으세요.');
  }
}

try {
  await main();
} catch (error) {
  console.error(`\n연결 실패: ${error.message}`);
  console.error('\n확인할 것:');
  console.error('  1. TURSO_DATABASE_URL이 libsql:// 로 시작하는지');
  console.error('  2. TURSO_AUTH_TOKEN을 공백 없이 전체 복사했는지');
  console.error(
    `  3. DB 엔진과 드라이버가 맞는지 — 지금은 "${TURSO_DRIVER}"입니다.`
  );
  console.error(
    `     안 되면 server/.env에 TURSO_DRIVER=${
      TURSO_DRIVER === 'turso' ? 'libsql' : 'turso'
    } 을 넣고 다시 실행해보세요.`
  );
  process.exitCode = 1;
} finally {
  await closeDb();
}
