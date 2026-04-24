[English](./README.md) | [Türkçe](./README.tr.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md)

> 이 문서는 영어 README를 번역한 것입니다. 일부 표현이 부자연스러울 수 있습니다.

<p align="center">
  <img src="./docs/logo.jpg" alt="omm logo" width="80"/>
</p>

<h1 align="center">Oh-my-mermaid</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/oh-my-mermaid"><img src="https://img.shields.io/npm/v/oh-my-mermaid" alt="npm version"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/></a>
</p>

<p align="center">
  AI는 몇 초 만에 코드를 작성합니다. 사람이 이해하는 데는 몇 시간이 걸립니다.<br/>
  이해를 건너뛰면, 코드베이스는 블랙박스가 됩니다 — 본인에게조차.<br/><br/>
  <strong>omm이 그 격차를 해소합니다 — AI가 생성한, 사람을 위한 아키텍처 문서.</strong>
</p>

---

## 빠른 시작

터미널에 붙여넣기:

```bash
npm install -g oh-my-mermaid && omm setup
```

AI 코딩 도구를 열고 `/omm-scan` 스킬을 실행:

```
/omm-scan
```

끝. 결과 보기:

```bash
omm view
```

## 예시

> omm이 자기 자신을 스캔했습니다. 이것이 결과입니다.

<table><tr>
<td width="50%"><img src="./docs/screenshot.png" alt="omm viewer"/></td>
<td width="50%"><img src="./docs/demo.gif" alt="omm scan demo"/></td>
</tr></table>

## 작동 방식

AI가 코드베이스를 분석하고 **관점(perspective)** 을 생성합니다 — 아키텍처를 바라보는 다양한 렌즈(구조, 데이터 흐름, 외부 연동 등). 각 관점에는 Mermaid 다이어그램과 문서 필드가 포함됩니다.

모든 노드는 **재귀적으로 분석**됩니다. 복잡한 노드는 자체 다이어그램을 가진 중첩 자식 element가 됩니다. 단순한 노드는 리프로 남습니다. 파일시스템이 트리를 직접 반영합니다:

```
.omm/
├── overall-architecture/           ← 관점
│   ├── description.md
│   ├── diagram.mmd
│   ├── context.md
│   ├── main-process/               ← 중첩 element
│   │   ├── description.md
│   │   ├── diagram.mmd
│   │   └── auth-service/           ← 더 깊은 중첩
│   │       └── ...
│   └── renderer/
│       └── ...
├── data-flow/
└── external-integrations/
```

뷰어는 파일시스템에서 중첩을 자동 감지합니다 — 자식이 있는 element는 확장 가능한 그룹으로, 나머지는 노드로 렌더링됩니다.

각 element는 최대 7개 필드를 가집니다: `description`, `diagram`, `context`, `constraint`, `concern`, `todo`, `note`.

## CLI

```bash
omm setup                          # AI 도구에 스킬 등록
omm view                           # 인터랙티브 뷰어 열기
omm config language ko             # 콘텐츠 언어 설정
omm update                         # 최신 버전으로 업데이트
```

전체 명령어는 `omm help`를 참고하세요.

## 스킬

스킬은 **AI 코딩 도구 안에서** 실행하는 명령어입니다 (터미널이 아닙니다). `/`로 시작합니다.

| 스킬 | 기능 |
| --- | --- |
| `/omm-scan` | 코드베이스 분석 → 아키텍처 문서 생성 |
| `/omm-push` | 로그인 + 연결 + 클라우드 푸시를 한 번에 |

## 클라우드

[ohmymermaid.com](https://ohmymermaid.com)을 통해 아키텍처를 클라우드에 저장할 수 있습니다.

```bash
omm login && omm link && omm push
```

기본적으로 비공개입니다. 팀과 공유하거나, [이 예시](https://ohmymermaid.com/share/c47e20a7063c231760361ed9cb9ec4b6)처럼 공개할 수 있습니다.

## 지원 AI 도구

| 플랫폼 | 설정 |
| --- | --- |
| Claude Code | `omm setup claude` |
| Codex | `omm setup codex` |
| Cursor | `omm setup cursor` |
| OpenClaw | `omm setup openclaw` |
| Antigravity | `omm setup antigravity` |
| Hermes | `omm setup hermes` |

`omm setup`을 실행하면 설치된 모든 도구를 자동 감지하고 설정합니다.

## 로드맵

[docs/ROADMAP.md](./docs/ROADMAP.md)를 참고하세요.

## 개발 & 기여

```bash
git clone https://github.com/oh-my-mermaid/oh-my-mermaid.git
cd oh-my-mermaid
npm install && npm run build
npm test
```

이슈와 PR을 환영합니다. [Conventional Commits](https://www.conventionalcommits.org/)를 사용해주세요.

## 라이선스

[MIT](./LICENSE)
