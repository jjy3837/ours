import { app } from './app.js';
import { PORT } from './config.js';
import { DB_PATH, initSchema, usingTurso } from './db.js';

await initSchema();

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT} 에서 실행 중`);
  console.log(`[server] DB(${usingTurso ? 'Turso' : '로컬 SQLite'}): ${DB_PATH}`);
});
