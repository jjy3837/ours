import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(currentDir, '../.env');

// 배포 환경은 플랫폼이 환경변수를 직접 주입하므로, .env가 없으면 조용히 넘어간다.
if (fs.existsSync(ENV_PATH)) {
  process.loadEnvFile(ENV_PATH);
}
