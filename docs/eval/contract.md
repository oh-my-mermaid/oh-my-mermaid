# Abstraction Contract

## Goal

omm이 생성하는 nested graph가 "코드를 전부 읽지 않아도 시스템 경계와 상호작용을 빠르게 이해하게 해주는가"를 판정한다.

## 5 Criteria

### 1. Natural Boundaries

- 각 class가 실제 아키텍처 단위여야 한다.
- 파일 묶음이 아니라 "하나의 책임/서브시스템"으로 읽혀야 한다.
- 너무 잘게 쪼개져 파일 트리 요약처럼 보이면 실패.
- 너무 크게 뭉쳐서 내부 구조가 안 보이면 실패.

### 2. Explainable Relations

- class 간 edge/@ref는 실제 중요한 의존/흐름만 담아야 한다.
- 빠지면 안 되는 핵심 관계가 있어야 한다.
- 사소한 import 관계를 전부 올려 그래프를 더럽히면 실패.
- "왜 연결됐는지"를 사람이 한 문장으로 설명할 수 있어야 한다.

### 3. Readable Traversal Order

- 처음 보는 사람이 "어디부터 보면 되는지" 감이 와야 한다.
- top-level class와 nested class 구조가 자연스러운 학습 순서를 만들어야 한다.
- 루트가 불명확하거나 순환 때문에 시작점이 안 보이면 실패.

### 4. Text Fields Add Value

- description/context/constraint/concern이 diagram만으로 안 보이는 판단 근거를 채워야 한다.
- 단순 요약 반복이면 실패.
- 특히 constraint, concern은 사람이 시스템 리스크를 이해하는 데 도움을 줘야 한다.

### 5. Stable Abstraction

- 같은 repo를 다시 스캔해도 class 경계가 불필요하게 흔들리지 않아야 한다.
- 작은 코드 변경이 전체 추상화 붕괴로 이어지면 실패.
- Note: baseline에서는 측정 불가 (최소 2회 스캔 필요). 이후 확인.

## Checklist

각 항목을 **Pass / Borderline / Fail** 로 평가.

| # | Check | Criteria |
|---|-------|---------|
| 1 | Top-level class 수가 적절하다 | 소형: ~3-6, 중형: ~4-8, 대형: ~5-10 (경향치, hard rule 아님) |
| 2 | Class 이름이 디렉터리명이 아니라 아키텍처 개념으로 읽힌다 | 1 |
| 3 | 각 class에 "왜 별도 class인지" 설명이 가능하다 | 1 |
| 4 | 핵심 서브시스템이 누락되지 않았다 | 1 |
| 5 | 불필요한 세부 구현 class가 top-level로 올라오지 않았다 | 1 |
| 6 | 핵심 흐름 edge/@ref가 보인다 | 2 |
| 7 | edge/@ref가 과도하게 많아 이해를 방해하지 않는다 | 2 |
| 8 | 시작점 또는 중심축이 보인다 | 3 |
| 9 | Nested graph가 줌아웃/줌인 경험을 제공한다 | 3 |
| 10 | description이 diagram 제목 반복이 아니다 | 4 |
| 11 | context가 외부 인터페이스나 상위 목적을 설명한다 | 4 |
| 12 | constraint가 실제 설계 제약을 담고 있다 | 4 |
| 13 | concern이 실제 리스크나 불확실성을 담고 있다 | 4 |
| 14 | 다시 스캔했을 때 class naming/granularity가 크게 흔들리지 않는다 | 5 (baseline: N/A) |

## Eval Repos

| Role | Repo | Purpose |
|------|------|---------|
| Gating | oh-my-mermaid | Dogfooding, small, 정확도 100% 검증 가능 |
| Gating | OpenClaw | 중간 규모, 모듈 경계 판별 |
| Gating | agito | 대형, 멀티 언어/서비스, nested abstraction 시험대 |
| Shadow | Understand-Anything | 외부 비교용 비게이팅 벤치마크, 과적합 방지 |

### Repo-Specific Expectations

**oh-my-mermaid**
- Expected top-level axes: CLI core, local viewer/server, cloud integration, platform/tool setup
- Watch for: CLI와 cloud가 한 덩어리로 뭉개지지 않는가, refs/diff/viewer가 "문서 탐색 경험" 축으로 읽히는가

**OpenClaw**
- Expected top-level axes: CLI/app shell, execution/runtime core, integrations/plugins, user-facing workflows
- Watch for: 모듈 경계가 import 구조와 대체로 맞는가, 내부 유틸이 top-level을 오염시키지 않는가

**agito**
- Expected top-level axes: desktop app, backend/server, website/site, shared infra/protocols, legacy boundary
- Watch for: 멀티서비스 구조가 top-level에서 바로 드러나는가, app↔server cross-boundary 관계, legacy 분리
