# oh-my-mermaid (omm) — Implementation Plan

## Context

바이브코딩 시 아키텍처가 비대해지고 개발자가 자기 코드를 이해하지 못하는 문제를 해결하는 도구.
**CLI가 `.omm/` 파일을 결정적으로 관리하고, Claude Code Skill이 AI 분석 후 CLI를 호출하는 구조.**
웹 뷰어(localhost:3000)로 mermaid 다이어그램을 실시간 시각화.

## 핵심 설계 결정

- **파일 구조**: 7파일 (description, diagram, constraint, concern, context, todo, note) + 자동 meta.yaml
- **note.md 세분화**: constraint(규칙), concern(위험), context(배경/결정), todo(할일), note(기타)로 분리하여 AI 분석 품질 향상
- **Skill 배포**: npm 패키지에 번들, `omm init` 시 `.claude/skills/omm-*/`에 자동 복사
- **MVP 범위**: CLI 전체 + omm-init/omm-scan 스킬 + 웹 뷰어 + diff 시각화
- **Class 간 연결**: `@class-name` 노드 네이밍 컨벤션 (플랫 구조 유지, N:N 참조 지원)

## 데이터 구조

```
.omm/
├── config.yaml              # 프로젝트 설정
├── overall-architecture/
│   ├── description.md       # 이 다이어그램이 뭘 보여주는지
│   ├── diagram.mmd          # mermaid 코드
│   ├── constraint.md        # 반드시 지켜야 할 규칙/제약
│   ├── concern.md           # 위험, 기술부채, 주의사항
│   ├── context.md           # 왜 이 구조인지, 배경, 결정 근거
│   ├── todo.md              # 해야 할 일, 개선 사항
│   ├── note.md              # 기타 추가 메모
│   └── meta.yaml            # 자동 관리 (날짜, 커밋 등)
└── auth-flow/
    ├── description.md
    ├── diagram.mmd
    ├── constraint.md
    ├── concern.md
    ├── context.md
    ├── todo.md
    ├── note.md
    └── meta.yaml
```

## CLI 명령어

### 글로벌 명령어

```bash
omm init                         # .omm/ 생성 + skills 자동 설치
omm list                         # 모든 class 목록
omm show <class>                 # class의 모든 필드 출력
omm delete <class>               # class 삭제
omm status                       # 전체 요약 (class 수, 마지막 갱신 등)
omm diff <class>                 # 현재 vs 이전 다이어그램 diff
omm refs <class>                 # 이 class를 참조하는 다른 class 목록
omm refs --reverse <class>       # 이 class가 참조하는 다른 class 목록
omm serve [--port 3000]          # 웹 뷰어 시작
```

### Class-Field 명령어

```bash
omm <class> <field> <content>    # 쓰기 (content 있으면)
omm <class> <field>              # 읽기 (content 없으면)
omm <class> <field> -            # stdin에서 읽기 (멀티라인)
```

**유효 필드**: `description`, `diagram`, `constraint`, `concern`, `context`, `todo`, `note`

**스킬에서 사용 예시** (heredoc):
```bash
omm auth-flow diagram - <<'MERMAID'
graph LR
    A[Client] --> B[API Gateway]
    B --> C[Auth Service]
MERMAID
```

### 동작 규칙

| 동작 | 규칙 |
|------|------|
| 쓰기 시 class 없으면 | 자동 생성 |
| 쓰기 시 meta.yaml | 자동 갱신 (updated, git_commit 등) |
| 읽기 출력 | stdout에 raw content (파이핑 가능) |
| 쓰기 확인 | stderr에 `wrote auth-flow/diagram.mmd (142 bytes)` |
| .omm/ 없을 때 | `error: .omm/ not found. Run 'omm init' first.` exit 1 |
| 잘못된 field | `error: unknown field 'foo'. Valid: description, diagram, note` exit 1 |

## 프로젝트 파일 구조

```
c-mermaid/oh-my-mermaid/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── src/
│   ├── cli.ts                    # 진입점, 인자 파싱
│   ├── commands/
│   │   ├── init.ts               # omm init (+ skill 자동 설치)
│   │   ├── class-field.ts        # omm <class> <field> [content|-]
│   │   ├── list.ts               # omm list
│   │   ├── show.ts               # omm show <class>
│   │   ├── delete.ts             # omm delete <class>
│   │   ├── status.ts             # omm status
│   │   ├── diff.ts               # omm diff <class>
│   │   ├── refs.ts               # omm refs <class>
│   │   └── serve.ts              # omm serve
│   ├── lib/
│   │   ├── store.ts              # .omm/ 파일 I/O 핵심 레이어
│   │   ├── meta.ts               # meta.yaml 자동 관리 (prev_diagram 보관 포함)
│   │   ├── diff.ts               # mermaid 경량 파서 + 노드/엣지 set diff
│   │   └── refs.ts               # @class-name 파싱 + 참조 그래프 생성
│   ├── server/
│   │   ├── index.ts              # HTTP 서버
│   │   ├── api.ts                # REST API 라우트
│   │   ├── watcher.ts            # fs.watch + SSE
│   │   └── viewer.html           # 단일 HTML (mermaid.js + marked.js CDN)
│   └── types.ts
├── skills/                        # npm 패키지에 포함, omm init 시 복사
│   └── omm-scan/
│       └── SKILL.md              # 전체 스캔 + 집중 분석 통합 (인자로 모드 판별)
└── test/
    ├── store.test.ts
    └── cli.test.ts
```

## Skill 설계

**역할 분리**: CLI `omm init`은 순수 파일시스템 셋업만 담당. AI 분석은 모두 Skill에서 처리.

### /omm-scan — 통합 스킬 (전체 스캔 + 집중 분석)

```yaml
---
name: omm-scan
description: 코드베이스 아키텍처를 분석하여 .omm/ 문서를 생성/갱신한다. 인자 없이 호출하면 전체 스캔, 인자가 있으면 해당 영역만 집중 분석하고 부모 diagram에 @참조를 자동 추가한다. "omm scan", "scan architecture", "update architecture", "omm scan auth flow", "analyze payment" 등으로 호출.
argument-hint: [topic]
---
```

**동작 모드 (인자 유무로 자동 판별):**

**A. 전체 스캔 모드** (`/omm-scan` — 인자 없음):
1. `.omm/`가 없으면 `omm init` 실행 (CLI)
2. `omm list`로 기존 class 확인
3. 프로젝트 구조 탐색 (Glob, Read — package.json, 디렉토리, 진입점)
4. **첫 실행 (class 없음)**: 전체 코드베이스 분석 → 3-7개 class 생성
5. **갱신 (class 있음)**: 기존 내용 읽기 → `git diff` 또는 재분석 → 변경된 class만 갱신
6. 각 class에 대해 CLI 호출:
   - `omm <class> description - <<'EOF'...EOF`
   - `omm <class> diagram - <<'MERMAID'...MERMAID`
   - `omm <class> constraint - <<'EOF'...EOF`
   - `omm <class> concern - <<'EOF'...EOF`
   - `omm <class> context - <<'EOF'...EOF`
   - `omm <class> todo - <<'EOF'...EOF`
   - `omm <class> note - <<'EOF'...EOF` (필요 시)
7. `@class-name` 참조 일관성 확인
8. 변경 요약 출력

**B. 집중 분석 모드** (`/omm-scan auth flow` — 인자 있음):
1. `$ARGUMENTS`에서 분석 대상 주제 파악 (e.g., "auth flow")
2. 주제를 kebab-case class 이름으로 변환 (e.g., "auth-flow")
3. 해당 주제 관련 코드를 깊이 분석 (Grep, Read로 관련 파일 추적)
4. 기존 class가 있으면 갱신, 없으면 새로 생성
5. **부모 자동 감지 및 갱신**:
   - `omm list`로 기존 class들 조회
   - 각 class의 diagram을 읽어서 새 class가 이미 참조되는지 확인
   - 참조가 없지만 논리적 부모가 있으면 (e.g., overall-architecture)
     → 부모 diagram에 `@new-class[Label]` 노드를 추가하여 갱신
6. `omm refs <class>`로 참조 관계 확인 출력
7. 결과 요약: "auth-flow 생성됨, overall-architecture에 @auth-flow 추가됨"

## 웹 뷰어 설계

### 인터페이스

```
┌─────────────────────────────────────────────┐
│  oh-my-mermaid                       [dark] │
├──────────┬──────────────────────────────────┤
│ Classes  │                                  │
│          │  ┌────────────────────────────┐  │
│ ● overall│  │                            │  │
│   auth   │  │   (rendered mermaid SVG)   │  │
│   data   │  │                            │  │
│          │  └────────────────────────────┘  │
│          │                                  │
│          │  Description                     │
│          │  이 다이어그램은 전체 시스템의... │
│          │                                  │
│          │  Notes                           │
│          │  - API 레이어 → Service만 허용   │
│          │  - TODO: 캐시 레이어 추가 필요   │
│          │                                  │
│          │  Meta                            │
│          │  Updated: 2026-03-21 14:30       │
├──────────┴──────────────────────────────────┤
│  ◀ prev                          next ▶     │
└─────────────────────────────────────────────┘
```

### Class 간 연결 (`@` 컨벤션)

diagram.mmd 안에서 `@class-name` 형태의 노드 ID를 사용하면, 해당 노드가 다른 class로의 링크가 됨.

**파일 구조는 플랫 유지:**
```
.omm/
├── overall-architecture/
│   └── diagram.mmd          ← @auth-flow, @data-pipeline 노드 포함
├── auth-flow/                ← 플랫하게 존재
│   └── diagram.mmd
└── data-pipeline/
    └── diagram.mmd
```

**diagram.mmd 예시:**
```mermaid
graph LR
    Client --> @auth-flow[Auth Service]
    Client --> @data-pipeline[Data Pipeline]
    @auth-flow --> DB[(Database)]
```

**규칙:**
- `@`로 시작하는 노드 ID → `.omm/`의 해당 class로 자동 링크
- 파서: `/^@([\w-]+)/` 정규식으로 감지
- 대상 class가 존재하지 않으면 웹 뷰어에서 경고 표시 (끊어진 링크)
- 하나의 class가 여러 diagram에서 참조 가능 (N:N)

**웹 뷰어 동작:**
- `@` 노드는 시각적으로 구분: 밑줄 + 포인터 커서 + 드릴다운 아이콘
- 클릭 시 해당 class 상세 뷰로 전환 (브레드크럼 네비게이션)
- 사이드바에서 참조 관계 트리로 표시

**CLI 지원:**
```bash
omm refs <class>             # 이 class를 참조하는 다른 class 목록
omm refs --reverse <class>   # 이 class가 참조하는 다른 class 목록
```

**필요한 구현:**
- `src/lib/refs.ts`: diagram.mmd 파싱 → `@` 노드 추출 → 참조 그래프 생성
- `src/commands/refs.ts`: refs CLI 명령어
- `src/server/viewer.html`: `@` 노드에 click 핸들러 + 브레드크럼 UI
- `src/server/api.ts`: `GET /api/class/:name/refs` 엔드포인트
- Skill (omm-init, omm-scan): diagram 생성 시 하위 class를 `@class-name`으로 명명하도록 지시

### UI 개선 사항 (MVP 포함)

**Mermaid 테마/classDef 자동 적용:**
- Skill이 diagram 생성 시 노드 상태별 색상 자동 부여
  - 우려점 있는 모듈 → 빨간색 (`classDef concern`)
  - 정상 모듈 → 초록색 (`classDef healthy`)
  - 최근 변경 모듈 → 노란색 (`classDef changed`)
  - 외부 의존성 → 회색 (`classDef external`)
- `.omm/config.yaml`에 테마 설정 포함

**인터랙티브 오버레이 (Mermaid SVG 후처리):**

1. **`@` 참조 노드 시각적 구분**:
   - `@class-name` 노드에 파란 점선 테두리 + 🔗 아이콘 + pointer 커서
   - 클릭 시 해당 class 상세 뷰로 이동
   - 대상 class가 없으면 빨간 점선 (끊어진 링크)

2. **백링크 바 (상단)**:
   - 현재 class를 참조하는 다른 class 목록을 다이어그램 위에 표시
   - `← Referenced by: overall-architecture, security-overview`
   - 클릭 시 해당 class로 이동

3. **줌/팬**:
   - 마우스 휠 → SVG viewBox 스케일 조정 (줌)
   - 마우스 드래그 → SVG viewBox 이동 (팬)
   - 줌 리셋 버튼

4. **Edge highlight**:
   - 노드 hover 시 연결된 엣지만 강조, 나머지 dim 처리

**대시보드 카드 뷰:**
- 모든 class를 카드 형태로 조감 (기본 진입점)
- 카드에 축소 SVG + note 개수 + 마지막 갱신 시간 표시
- 카드 클릭 → 상세 뷰 전환

### Diff 시각화 (MVP 포함)

아키텍처 변경을 시각적으로 보여주는 핵심 기능.

**동작 방식:**
1. `omm <class> diagram` 쓰기 시, 이전 내용을 `meta.yaml`의 `prev_diagram` 필드에 자동 보관
2. 웹 뷰어에서 [Diff] 버튼 클릭 시 Before/After 병렬 비교
3. 변경된 노드/엣지를 색상으로 하이라이트

**Diff 렌더링:**
```
┌──────────── Before ────────────┬──────────── After ───────────────┐
│                                │                                  │
│  A → B → C                    │  A → B → C                      │
│                                │       ↘                          │
│                                │        D (🟢 추가됨)             │
│                                │                                  │
│  B → E                        │  B → E (🔴 제거됨 → 점선)       │
└────────────────────────────────┴──────────────────────────────────┘
```

**구현 방법:**
- mermaid 텍스트를 라인 단위로 파싱하여 노드/엣지 목록 추출 (정규식 기반 경량 파서)
- Before/After 노드/엣지 집합을 비교 (set diff)
- After 다이어그램에 classDef 주입: 추가=초록, 제거=빨강 점선, 변경=노랑
- 두 다이어그램을 side-by-side로 렌더링

**CLI 지원:**
```bash
omm diff <class>              # 현재 vs 이전 버전 diff (터미널 텍스트 출력)
```

**필요한 변경:**
- `src/lib/meta.ts`: diagram 쓰기 시 이전 내용을 `prev_diagram`에 보관
- `src/lib/diff.ts`: mermaid 텍스트 경량 파서 + set diff 로직
- `src/commands/diff.ts`: CLI diff 명령어
- `src/server/viewer.html`: Diff 뷰 UI (side-by-side + 하이라이트)
- `src/server/api.ts`: `GET /api/class/:name/diff` 엔드포인트

### 기술 구현

- **서버**: Node.js `http` 모듈 (express 없이)
- **클라이언트**: 단일 HTML + mermaid.js (CDN) + marked.js (CDN) + vanilla JS
- **실시간 갱신**: SSE (Server-Sent Events) — fs.watch → SSE push → 브라우저 리렌더
- **API**:
  - `GET /` — HTML 페이지
  - `GET /api/classes` — class 목록 JSON
  - `GET /api/class/:name` — class 전체 내용 JSON
  - `GET /api/class/:name/diff` — diff 데이터 JSON
  - `GET /api/class/:name/refs` — 참조 관계 JSON
  - `GET /events` — SSE 스트림

## 구현 순서

### Step 1: 프로젝트 초기화
- `npm init`, tsconfig.json, tsup.config.ts
- package.json의 `"bin": { "omm": "./dist/cli.js" }`

### Step 2: 코어 라이브러리
- `src/lib/store.ts` — .omm/ 읽기/쓰기 핵심
- `src/lib/meta.ts` — meta.yaml 자동 관리
- `src/types.ts` — 타입 정의

### Step 3: CLI 명령어
- `src/cli.ts` — 인자 파싱 + 라우팅
- `src/commands/init.ts`
- `src/commands/class-field.ts` (핵심: read/write/stdin)
- `src/commands/list.ts`, `show.ts`, `delete.ts`, `status.ts`
- `src/commands/diff.ts` — 현재 vs 이전 다이어그램 비교
- `src/commands/refs.ts` — class 간 참조 관계 조회
- `src/lib/diff.ts` — mermaid 경량 파서 (노드/엣지 추출 + set diff)
- `src/lib/refs.ts` — `@class-name` 파싱 + 참조 그래프

### Step 4: 웹 뷰어
- `src/server/viewer.html` — 단일 HTML 템플릿
- `src/server/api.ts` — REST API
- `src/server/watcher.ts` — fs.watch + SSE
- `src/server/index.ts` — HTTP 서버
- `src/commands/serve.ts`

### Step 5: Skills
- `skills/omm-scan/SKILL.md` — 통합 스킬 갱신 (전체 스캔 + 집중 분석, 인자로 모드 판별)
- `omm init`이 `.claude/skills/`에 복사 (기존 로직 유지)
- 기존 `skills/omm-init/` 디렉토리 삭제

### Step 6: 빌드 & 로컬 테스트
- tsup으로 빌드
- `npm link`로 로컬 `omm` 명령어 등록
- CLI 전체 명령어 수동 테스트
- vitest 단위 테스트 (store, diff, refs)

### Step 7: 통합 테스트
- 이 프로젝트(c-mermaid) 자체를 대상으로 `/omm-init` 실행하여 검증
- `omm serve` → 웹 뷰어 동작 확인
- `@` 참조 네비게이션, diff 시각화 확인

### Step 8: 배포 준비
- `npm pack`으로 tarball 생성 → 로컬 설치 테스트
- `npx oh-my-mermaid init` 동작 확인
- skill 자동 복사 경로 검증 (dist/ 기준 상대 경로)
- npm publish

## 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| 언어 | TypeScript | 타입 안전성 |
| 빌드 | tsup | 제로 설정, 빠름 |
| CLI 파싱 | process.argv 직접 | 문법이 단순, 의존성 최소화 |
| YAML | `yaml` npm | config.yaml, meta.yaml 처리 |
| 웹 서버 | Node.js `http` | 의존성 없음 |
| Mermaid 렌더링 | mermaid.js CDN (클라이언트) | 서버 의존성 없음 |
| Markdown 렌더링 | marked.js CDN (클라이언트) | 서버 의존성 없음 |
| 테스트 | vitest | tsup과 같은 esbuild 기반, 설정 최소 |

## 배포 전략

### package.json 핵심 설정

```json
{
  "name": "oh-my-mermaid",
  "version": "0.1.0",
  "description": "Architecture mirror for vibe coding — CLI + Claude Code skills",
  "bin": { "omm": "./dist/cli.js" },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist/",
    "skills/",
    "LICENSE"
  ],
  "keywords": ["mermaid", "architecture", "diagram", "claude-code", "vibe-coding"],
  "engines": { "node": ">=18" },
  "scripts": {
    "build": "tsup",
    "prepublishOnly": "npm run build"
  }
}
```

### 빌드 설정 (tsup.config.ts)

```typescript
export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    index: 'src/index.ts'   // 라이브러리 진입점 (프로그래밍 API)
  },
  format: ['esm'],
  dts: true,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node'  // cli.js에만 적용
  },
  // viewer.html을 dist/에 복사
  onSuccess: 'cp src/server/viewer.html dist/'
})
```

### 배포 대상

| 방식 | 명령어 | 용도 |
|------|--------|------|
| **글로벌 설치** | `npm install -g oh-my-mermaid` | 일반 사용자 |
| **npx 일회성** | `npx oh-my-mermaid init` | 빠른 체험 |
| **프로젝트 dev** | `npm install -D oh-my-mermaid` | CI/CD 통합 |

### 번들링 고려사항

**dist/ 구조 (배포 시 포함):**
```
dist/
├── cli.js           # CLI 진입점 (#!/usr/bin/env node)
├── index.js         # 라이브러리 API (프로그래밍적 사용)
├── index.d.ts       # 타입 정의
└── viewer.html      # 웹 뷰어 HTML (단일 파일, CDN 참조)
```

**skills/ 디렉토리 (배포 시 포함):**
```
skills/
├── omm-init/SKILL.md
└── omm-scan/SKILL.md
```

### Skill 자동 설치 로직 (init.ts)

```typescript
// omm init 시:
// 1. .omm/ 디렉토리 생성
// 2. skills/ → .claude/skills/omm-*/ 복사
//    - 이미 존재하면 버전 비교 후 갱신 여부 확인
//    - package.json 버전을 skill에 주석으로 포함하여 버전 추적
// 3. config.yaml 생성
```

`omm init` 실행 시 `skills/`를 사용자 프로젝트의 `.claude/skills/`로 복사.
복사 소스 경로: `path.join(__dirname, '..', 'skills')` (dist/ 기준 상대 경로).
**omm-scan 스킬**: `.omm/`가 없으면 내부에서 `omm init` 자동 실행.

### npm publish 워크플로우

```bash
# 로컬 테스트
npm run build
npm link
omm init                          # 동작 확인

# 배포
npm version patch                 # 버전 범프
npm publish                       # npm 레지스트리에 배포

# 사용자 설치
npm install -g oh-my-mermaid
omm init
```

### CI/CD 통합 (사용자 프로젝트에서)

```json
// 사용자 프로젝트의 package.json
{
  "devDependencies": {
    "oh-my-mermaid": "^0.1.0"
  },
  "scripts": {
    "arch:check": "omm status",
    "arch:serve": "omm serve"
  }
}
```

```yaml
# GitHub Actions 예시 — PR에서 아키텍처 변경 체크
- name: Check architecture freshness
  run: npx oh-my-mermaid status
```

### 버전 관리 전략

- **Semantic Versioning**: major.minor.patch
- `0.x.y` 동안은 API 불안정 허용
- Skill 파일에 `# omm-version: 0.1.0` 주석 포함 → `omm init` 시 구버전 skill 감지 및 갱신 제안

---

# Cloud Service MVP — Hosted Viewer

## Context

oh-my-mermaid CLI는 오픈소스로 유지. 클라우드 서비스로 BM화하여 수익 모델 구축.
첫 MVP: `omm push` → Supabase에 업로드 → 공유 가능한 URL로 아키텍처 다이어그램 제공.

## BM 구조

```
Open Source (무료)              Cloud Service (유료)
┌──────────────┐                ┌──────────────────────┐
│ omm CLI      │  omm push →   │ Hosted Viewer        │
│ omm serve    │                │ 공유 URL             │
│ /omm-scan    │  omm pull ←   │ 팀 대시보드          │
│ 로컬 viewer  │                │ 변경 알림            │
└──────────────┘                └──────────────────────┘
        무료                      Free: 1 프로젝트
                                  Pro: $9/월 무제한
```

## 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| Frontend | Vercel (Next.js) | viewer.html 기반 확장, SSR |
| Auth | Supabase Auth | GitHub OAuth, 간편 |
| DB | Supabase PostgreSQL | 프로젝트/유저/팀 관리 |
| Storage | Supabase Storage | .omm/ 파일 저장 (S3 호환) |
| Hosting | Vercel | Next.js 최적, 자동 배포 |
| CLI 연동 | REST API on Vercel | /api/push, /api/pull 등 |
| Supabase Client | @supabase/supabase-js + @supabase/ssr | SSR 지원 |

**Supabase API Keys (최신):**
- `sb_publishable_...` — 클라이언트용 (기존 anon key 대체)
- `sb_secret_...` — 서버용 (기존 service_role key 대체, 복수 생성 가능)
- Secret key는 JWT가 아니므로 Authorization 헤더에 직접 사용 불가
- 서버 사이드(API Routes, Edge Functions)에서만 사용

## 아키텍처

```
omm push (CLI)
    │
    ▼ REST API (JWT)
┌─── Vercel API Routes ────────────────────┐
│                                          │
│  POST /api/push    ← .omm/ 파일 업로드  │
│  GET  /api/pull    ← .omm/ 파일 다운로드 │
│  GET  /api/project ← 프로젝트 메타데이터 │
│  POST /api/auth    ← GitHub OAuth        │
│                                          │
└────┬──────────────┬──────────────────────┘
     │              │
┌────▼────┐   ┌─────▼─────────┐
│Supabase │   │ Supabase      │
│   DB    │   │  Storage      │
│(PG)     │   │ (.omm files)  │
└─────────┘   └───────────────┘

브라우저:
  https://omm.dev/p/{project-slug}
    → Vercel SSR/CSR
    → Supabase에서 .omm/ 파일 fetch
    → mermaid.js로 렌더링 (기존 viewer.html 로직 재사용)
```

## DB 스키마 (Supabase PostgreSQL)

```sql
-- 사용자
create table users (
  id uuid primary key default gen_random_uuid(),
  github_id text unique not null,
  github_username text not null,
  email text,
  created_at timestamptz default now()
);

-- 프로젝트
create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references users(id),
  slug text unique not null,          -- URL용: omm.dev/p/{slug}
  name text not null,                 -- 프로젝트 이름
  description text,
  is_public boolean default false,    -- 공개/비공개
  plan text default 'free',           -- free, pro, team
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- API 토큰 (CLI 인증용)
create table api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  token_hash text unique not null,
  name text,
  last_used_at timestamptz,
  created_at timestamptz default now()
);

-- Push 히스토리
create table push_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  user_id uuid references users(id),
  git_commit text,
  classes_count int,
  created_at timestamptz default now()
);
```

## Supabase Storage 구조

```
omm-files/
├── {project-id}/
│   ├── config.yaml
│   ├── overall-architecture/
│   │   ├── description.md
│   │   ├── diagram.mmd
│   │   ├── constraint.md
│   │   ├── concern.md
│   │   ├── context.md
│   │   ├── todo.md
│   │   ├── note.md
│   │   └── meta.yaml
│   └── auth-flow/
│       └── ...
```

## CLI 추가 명령어 (오픈소스에 포함)

```bash
omm login                   # GitHub OAuth → API 토큰 발급
omm push                    # .omm/ → Supabase Storage 업로드
omm pull                    # Supabase Storage → .omm/ 다운로드
omm link                    # 현재 프로젝트를 클라우드 프로젝트에 연결
omm share                   # 공유 URL 출력
omm logout                  # 토큰 삭제
```

### omm push 동작

```
1. .omm/config.yaml에서 cloud.project_id 확인
2. 없으면 → omm link 안내 또는 신규 프로젝트 생성
3. .omm/ 디렉토리 전체를 Supabase Storage에 업로드
   - 변경된 파일만 업로드 (meta.yaml의 updated 기준)
4. push_history에 기록
5. 공유 URL 출력: https://omm.dev/p/{slug}
```

### omm login 동작

```
1. 브라우저 열기 → https://omm.dev/auth/cli
2. GitHub OAuth 인증
3. 콜백으로 API 토큰 수신
4. ~/.omm/credentials.json에 저장
```

## Vercel 프로젝트 구조

```
cloud/
├── package.json
├── next.config.ts
├── src/
│   ├── app/
│   │   ├── page.tsx                  # 랜딩 페이지
│   │   ├── p/[slug]/page.tsx         # Hosted Viewer (핵심)
│   │   ├── dashboard/page.tsx        # 내 프로젝트 목록
│   │   └── auth/
│   │       ├── login/page.tsx        # GitHub OAuth
│   │       └── cli/page.tsx          # CLI 인증 콜백
│   ├── api/
│   │   ├── push/route.ts             # POST: .omm/ 업로드
│   │   ├── pull/route.ts             # GET: .omm/ 다운로드
│   │   ├── project/route.ts          # CRUD: 프로젝트 관리
│   │   └── auth/route.ts             # 토큰 발급
│   ├── components/
│   │   ├── MermaidViewer.tsx          # viewer.html → React 컴포넌트화
│   │   ├── Dashboard.tsx             # 카드 뷰 대시보드
│   │   ├── ClassDetail.tsx           # 상세 뷰
│   │   └── DiffView.tsx              # Diff 시각화
│   └── lib/
│       ├── supabase.ts               # Supabase 클라이언트
│       └── omm.ts                    # .omm/ 파일 파싱 유틸
├── supabase/
│   └── migrations/
│       └── 001_initial.sql           # DB 스키마
└── .env.local
    # NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
    # NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
    # SUPABASE_SECRET_KEY=sb_secret_...  (서버 전용, 복수 생성 가능)
```

## 구현 순서

### Step 1: Supabase 셋업
- Supabase 프로젝트 생성
- DB 마이그레이션 (users, projects, api_tokens, push_history)
- Storage 버킷 생성 (omm-files)
- Auth: GitHub OAuth provider 설정

### Step 2: Vercel 프로젝트 초기화
- Next.js 프로젝트 생성 (cloud/ 디렉토리)
- Supabase 클라이언트 설정
- 환경변수 설정

### Step 3: API 라우트
- POST /api/auth — GitHub OAuth → 토큰 발급
- POST /api/push — .omm/ 파일 수신 → Supabase Storage 저장
- GET /api/pull — Supabase Storage → .omm/ 파일 반환
- CRUD /api/project — 프로젝트 생성/조회

### Step 4: Hosted Viewer 페이지
- /p/[slug] — 기존 viewer.html 로직을 React 컴포넌트로 전환
- Supabase Storage에서 .omm/ 파일 fetch
- mermaid.js 렌더링 + diff + refs 네비게이션

### Step 5: CLI 명령어 추가
- omm login, push, pull, link, share, logout
- ~/.omm/credentials.json 관리
- .omm/config.yaml에 cloud 섹션 추가

### Step 6: 배포 & 테스트
- Vercel 배포
- 도메인 연결 (omm.dev 또는 유사)
- E2E: `omm login` → `omm push` → 브라우저에서 URL 확인

## 검증 방법

1. **CLI 단위 테스트**: `omm init` → `.omm/` 생성 확인, `omm test-class diagram "graph LR; A-->B"` → 파일 쓰기 확인
2. **스킬 통합 테스트**: `/omm-init` 실행 → `.omm/` 에 class들 생성 확인
3. **웹 뷰어 테스트**: `omm serve` → localhost:3000 접속 → 다이어그램 렌더링 확인
4. **실시간 갱신 테스트**: `omm serve` 실행 중 → 다른 터미널에서 `omm <class> diagram ...` → 브라우저 자동 갱신 확인
5. **E2E 시나리오**: `omm init` → `/omm-scan` → `omm serve` → 브라우저에서 아키텍처 확인
6. **배포 테스트**: `npm pack` → 로컬 tarball 설치 → `npx oh-my-mermaid init` 동작 확인
7. **Skill 설치 테스트**: `omm init` → `.claude/skills/omm-init/SKILL.md` 존재 확인
8. **Diff 테스트**: diagram 두 번 쓰기 → `omm diff <class>` → 변경사항 출력 확인
9. **Refs 테스트**: `@class-name` 노드 포함 diagram 생성 → `omm refs <class>` → 참조 관계 출력 확인
