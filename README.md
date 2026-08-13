# 우리를 위한 한마디

익명으로 고민에 대한 조언/위로의 글귀를 남기고, 동시에 다른 사람이 남긴 조언을 받아가는 웹 서비스입니다.

## 기술 스택

| 영역     | 사용 기술                                            |
| -------- | ---------------------------------------------------- |
| Frontend | React 18 + Vite 6                                    |
| Backend  | Node.js + Express 4                                  |
| DB       | SQLite — 로컬은 `node:sqlite`, 배포는 Turso(libSQL)  |

DB는 환경변수 하나로 갈립니다. `TURSO_DATABASE_URL`이 있으면 Turso에 접속하고, 없으면 Node 내장 `node:sqlite`로 로컬 파일(`server/data/advices.db`)을 씁니다. 두 경로 모두 네이티브 컴파일이 없어 Windows에서 빌드 도구 없이 설치됩니다. 대신 **Node 23.4 이상**이 필요합니다.

SQL은 `server/src/advicesRepository.js`에, 접속·스키마는 `server/src/db.js`에 모여 있습니다.

## 사전 준비

Node.js 24 LTS 권장 (최소 23.4). ([nodejs.org](https://nodejs.org) 또는 `winget install OpenJS.NodeJS.LTS`)

```powershell
node -v   # v23.4.0 이상인지 확인
```

## 실행 방법

```powershell
# 1. 의존성 설치 (루트에서 한 번만, npm workspaces로 server/client 모두 설치됩니다)
npm install

# 2. DB 생성 + 시드 데이터 넣기
npm run seed

# 3. 서버(4000) + 클라이언트(5173) 동시 실행
npm run dev
```

브라우저에서 http://localhost:5173 접속.

### 개별 실행

```powershell
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173 (/api 요청은 4000으로 프록시)
```

### 프로덕션 실행

```powershell
npm run serve   # 빌드 후 서버 실행 (build + start)
```

`client/dist`가 있으면 Express가 API와 프론트엔드를 **한 프로세스로 함께** 서비스합니다. http://localhost:4000 하나로 앱 전체가 뜹니다. `dist`가 없으면 API만 서비스하고 그 사실을 로그로 알려줍니다.

## 배포 — 무료 + 영구 (Render + Turso)

전부 무료이고 기간 제한이 없는 조합입니다.

| 역할 | 서비스 | 비용 | 영구성 |
| ---- | ------ | ---- | ------ |
| 웹 호스팅 | Render free | $0 | URL 영구 유지 |
| 데이터베이스 | Turso free | $0 | 기간 제한 없음 (5GB, 월 1천만 행 쓰기) |

Render 무료 웹서비스는 파일시스템이 초기화되고, Render 무료 Postgres는 **30일 후 만료**되어 영구 저장에 쓸 수 없습니다. 그래서 DB만 Turso(SQLite 호환 libSQL)로 분리했습니다. 코드는 `TURSO_DATABASE_URL`이 있으면 Turso, 없으면 로컬 SQLite 파일을 쓰므로 개발 방식은 그대로입니다.

### 1단계. Turso 데이터베이스 만들기

[turso.tech](https://turso.tech) 대시보드에서 데이터베이스를 만들고 접속 정보 두 개를 복사합니다.

- **Database URL** — `libsql://<이름>-<계정>.turso.io` 형태
- **Auth Token** — 길게 생긴 토큰 문자열

**엔진 선택에 주의하세요.** Turso Cloud는 엔진이 두 종류이고 드라이버가 서로 호환되지 않습니다. 이 프로젝트는 둘 다 지원하지만 `TURSO_DRIVER` 값을 맞춰야 합니다.

| 만든 DB 엔진 | `TURSO_DRIVER` | 사용 패키지 |
| --- | --- | --- |
| libSQL (기존) | `libsql` (기본값) | `@libsql/client` |
| Turso (신규) | `turso` | `@tursodatabase/serverless` |

CLI를 쓴다면 (Windows는 WSL 필요):

```bash
turso db create words-for-us            # libSQL 엔진
turso db create words-for-us --tursodb  # Turso 엔진
turso db show words-for-us --url
turso db tokens create words-for-us
```

### 2단계. 로컬에서 접속 확인하고 시드 넣기

배포 전에 접속이 되는지 먼저 확인하는 편이 문제를 찾기 쉽습니다. `server/.env.example`을 `server/.env`로 복사하고 위 두 값을 채우세요. `.env`는 `.gitignore`에 있어 저장소에 올라가지 않습니다.

```powershell
Copy-Item server\.env.example server\.env
# server\.env 를 열어 두 값을 붙여넣습니다.

npm run db:check   # 연결 확인 (토큰은 마스킹되어 출력됩니다)
npm run seed       # Turso에 시드 24건 넣기
```

`db:check`가 `대상 : Turso (원격, 영구 저장)`로 나오면 정상입니다. `로컬 SQLite 파일`로 나오면 `.env` 값이 안 읽힌 것입니다.

여기서 시드를 미리 넣어두면 배포 직후부터 글이 채워진 상태로 뜹니다.

### 3단계. GitHub 저장소로 올리기

```powershell
git init
git add .
git commit -m "우리를 위한 한마디 초기 구현"
git branch -M main
git remote add origin https://github.com/<사용자명>/<저장소명>.git
git push -u origin main
```

### 4단계. Render에 배포하기

[dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint** → 해당 저장소 선택 → Apply.

`render.yaml`이 아래를 자동으로 잡아줍니다.

| 항목        | 값                              |
| ----------- | ------------------------------- |
| Build       | `npm install && npm run build`  |
| Start       | `npm run seed && npm start`     |
| Node        | 24.19.0 (`.node-version`)       |
| Healthcheck | `/api/health`                   |

배포 직전에 환경변수 두 개를 입력하라고 물어봅니다. 1단계에서 복사한 값을 넣으세요.

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

**이 두 값을 넣지 않으면** 앱은 동작하지만 임시 파일에 저장해서 재시작 때 글이 사라집니다. 시작 로그에 `DB(Turso)` 또는 `DB(로컬 SQLite)`가 찍히니 그걸로 확인할 수 있습니다.

시딩은 매 부팅마다 실행되지만 동일 `content`를 건너뛰므로 데이터가 중복되지 않습니다.

### 첫 접속이 느릴 때

Render 무료 웹서비스는 15분간 접속이 없으면 절전에 들어가고, 다시 깨어나는 데 약 1분이 걸립니다(고장이 아닙니다). 무료 한도가 월 750시간이고 한 달은 약 730시간이므로, 외부 무료 크론([cron-job.org](https://cron-job.org) 등)으로 10분마다 `/api/health`를 호출하면 한도 안에서 항상 깨어 있게 유지할 수 있습니다.

### 나중에 PostgreSQL로 옮긴다면

스펙에 언급된 전환 경로입니다. SQL은 `server/src/advicesRepository.js`에, 접속은 `server/src/db.js`에 모여 있어 이 두 파일만 교체하면 됩니다.

## 화면 흐름

| 단계 | 화면        | 내용                                                                        |
| ---- | ----------- | --------------------------------------------------------------------------- |
| 1    | 입력        | 5개 카테고리 중 1개를 랜덤 노출 → 그 주제로 한마디 작성 (최소 10자, 작성 예시 제공) |
| 2    | 카테고리 선택 | 5지선다로 읽고 싶은 카테고리 선택                                            |
| 3    | 결과        | 해당 카테고리 랜덤 1건 노출, "다른 글 보기"로 재추첨                          |
| 4    | 클로징      | 서울 항공뷰 배경 + 마무리 문구, "처음으로"                                    |

Step 1에서 노출된 카테고리가 그대로 저장 태그로 쓰입니다(AI 자동분류 없음).

## API

| 메서드 | 경로                                        | 설명                                                       |
| ------ | ------------------------------------------- | ---------------------------------------------------------- |
| POST   | `/api/advices`                              | `{ category, content }` 저장. 201 + `{ advice }`            |
| GET    | `/api/advices/random?category=&exclude=`    | 랜덤 1건. 없으면 `{ advice: null }` (200)                   |
| GET    | `/api/advices/count?category=`              | 카테고리 개수. `category` 생략 시 전체 카테고리 개수        |
| GET    | `/api/advices/categories`                   | 카테고리 목록                                               |
| GET    | `/api/health`                               | 헬스 체크                                                   |

`exclude`는 "다른 글 보기"에서 직전에 본 글을 피하기 위한 값입니다. 그 카테고리에 글이 1건뿐이면 같은 글을 그대로 돌려줍니다.

### 요청 예시

```powershell
curl -X POST http://localhost:4000/api/advices `
  -H "Content-Type: application/json" `
  -d '{\"category\":\"진로\",\"content\":\"조금 돌아가도 결국 도착합니다.\"}'
```

## 데이터 모델

```sql
CREATE TABLE advices (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  category   TEXT NOT NULL CHECK (category IN ('인간관계','진로','커리어','경제적 사정','기타')),
  content    TEXT NOT NULL CHECK (length(trim(content)) > 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
```

DB 파일은 `server/data/advices.db`에 생성되며 git에는 포함되지 않습니다. `DB_PATH` 환경변수로 경로를 바꿀 수 있습니다.

## 시딩

```powershell
npm run seed          # 중복(동일 content)은 건너뛰고 새 항목만 추가 — 여러 번 실행해도 안전
npm run seed:reset    # 기존 데이터 전부 삭제 후 다시 시딩
```

다른 파일로 시딩하려면:

```powershell
node server/scripts/seed.js --file ./server/data/seed_data.json
```

시드 파일은 `server/data/seed_data.json`이며 `{ category, content }` 배열 형식입니다. 카테고리가 enum에 없는 항목은 건너뛰고 사유를 출력합니다.

### 원본 시드 데이터에서 바뀐 점

- 원본의 `진로/커리어` 7건을 스펙 enum에 맞춰 **진로 4건 / 커리어 3건**으로 나눴습니다.
- **인물 이름과 인용부호를 모두 제거**했습니다. 화면에는 문장만 노출됩니다. (`"사랑은 아낌없이 주는 것이다." - 톨스토이` → `사랑은 아낌없이 주는 거예요.`)
- **말투를 -요체로 통일**했습니다. 위로를 건네는 화면 톤에 맞추기 위해서입니다.
- `경제적 사정`은 시드 데이터가 없어 처음에는 Step 3에서 "아직 등록된 글이 없어요"가 노출됩니다. 사용자 입력이 쌓이면 자연히 채워집니다.

시딩 시 10자 미만인 항목은 경고만 출력하고 그대로 넣습니다. 10자 제한은 사용자 입력에만 적용되는 규칙이기 때문입니다. (현재 시드 데이터에는 해당 항목이 없습니다.)

여기에 서비스 기획자가 직접 쓴 `진로` 글 1건을 더해 시드는 총 24건입니다.

카테고리별 현재 개수: 인간관계 6 / 진로 5 / 커리어 3 / 경제적 사정 0 / 기타 10 = **총 24건**

## 디자인

- 기본 톤: 오렌지(`#F4A261`, `#E76F51`) + 아이보리(`#FFF8F0`)
- Step 4: 서울 항공뷰 사진(`client/public/assets/closing-photo.jpg`) + `rgba(60, 40, 10, 0.4)` 오버레이
- 폰트: Pretendard(본문), 나눔스퀘어라운드(클로징 문구)

배경 사진을 교체하려면 `client/public/assets/closing-photo.jpg`를 덮어쓰면 됩니다.

## 폴더 구조

```
.
├── client/                      # React (Vite)
│   ├── public/assets/closing-photo.jpg
│   └── src/
│       ├── components/          # Step1~4 + StepShell
│       ├── api.js               # fetch 래퍼
│       ├── constants.js         # 카테고리 정의
│       └── styles.css
└── server/                      # Express + SQLite
    ├── data/seed_data.json
    ├── scripts/seed.js
    └── src/
        ├── routes/advices.js
        ├── advicesRepository.js # SQL 쿼리 모음
        ├── config.js            # 카테고리 enum, 길이 제한
        └── db.js                # 연결 + 스키마 + 트랜잭션 헬퍼
```

카테고리 목록이나 길이 제한을 바꿀 때는 `server/src/config.js`와 `client/src/constants.js` 두 곳을 함께 수정하세요.
