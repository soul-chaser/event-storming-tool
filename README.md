# Event Storming Tool

DDD 기반 Event Storming 데스크톱 애플리케이션입니다. Electron + React + TypeScript로 구현되어 있으며, Hexagonal Architecture/CQRS를 따릅니다.

## 주요 기능

- Event 생성/이동/이름 변경/삭제
- Aggregate 자동 감지
- 보드 변경 시 즉시 저장
- 안전한 파일 저장(원자적 저장)
- 앱 재실행 시 기존 보드 이어하기/새 보드 시작 선택
- 저장 경로 설정 UI 제공

## 저장 정책

- 기본 보드 저장 경로: `~/.event_storming_tool/boards`
- 앱 설정 파일: `~/.event_storming_tool/.config`
- 보드 메타데이터 인덱스: `<boardsPath>/.board-index.json`

## 실행

```bash
npm install
npm test
npm run build
```

개발 실행:

```bash
npm run dev
npm run electron:dev
```

## 시작 플로우

1. 앱 시작 시 설정의 저장 경로를 로드합니다.
2. 보드가 있으면 시작 모달에서 이어갈 보드를 선택합니다.
3. 보드가 없거나 새로 시작을 선택하면 이름을 입력해 새 보드를 생성합니다.
4. 이후 변경 작업은 커맨드 처리 후 즉시 파일에 반영됩니다.

## 아키텍처

- `src/domain`: 순수 도메인 모델
- `src/application`: Command/Query 핸들러
- `src/infrastructure`: 파일 저장소/직렬화/어댑터
- `src/presentation`: Electron IPC + React UI

## TypeScript 경로 규칙

- 소스 import alias는 `@application/*`, `@domain/*`, `@infrastructure/*`, `@presentation/*`를 사용합니다.
- TypeScript 소스 간 import는 `.js` 확장자를 직접 붙이지 않습니다.
- 루트 `tsconfig.json`의 `rootDir`는 `.`이며, `src`와 `tests`를 함께 타입체크합니다.

## 테스트

현재 Vitest 기준 전체 테스트가 통과해야 정상 상태입니다.

```bash
npm test
```

## 문서

- [프로젝트 현황](./doc/development/PROJECT_COMPLETE.md)
- [Domain Layer](./doc/development/DOMAIN_LAYER_DONE.md)
- [Application Layer](./doc/development/APPLICATION_LAYER_DONE.md)
- [Infrastructure Layer](./doc/development/INFRASTRUCTURE_LAYER_DONE.md)
- [Presentation Layer](./doc/development/PRESENTATION_LAYER_DONE.md)
