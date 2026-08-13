import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { advicesRouter } from './routes/advices.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(currentDir, '../../client/dist');

export const app = express();

app.use(cors());
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/advices', advicesRouter);

// API 경로는 프론트엔드 폴백으로 새지 않게 여기서 JSON 404로 끊는다.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: '존재하지 않는 경로입니다.' });
});

// 빌드 결과가 있으면 한 프로세스로 프론트엔드까지 서비스한다(배포용).
// 개발 중에는 dist가 없을 수 있어 존재할 때만 연결한다.
if (fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
  console.log(`[server] 정적 파일 서비스: ${CLIENT_DIST}`);
} else {
  console.log('[server] client/dist 없음 — API만 서비스합니다 (npm run build 후 재시작하면 함께 서비스)');
}

app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: '존재하지 않는 경로입니다.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' });
});
