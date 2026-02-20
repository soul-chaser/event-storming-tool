# Event Storming Tool

DDD 기반 Event Storming 도구 - Hexagonal Architecture로 구현

## 🎯 프로젝트 개요

Event Storming을 쉽고 간편하게 수행하고, 결과를 다양한 형식으로 export/import 할 수 있는 PC 애플리케이션입니다.

## ✨ 주요 기능

- ✅ **Event 관리**: 생성, 이동, 삭제
- ✅ **Aggregate 자동 감지**: 근접한 이벤트 그룹화 (300px 기준)
- ✅ **흐름 검증**: Command → Domain Event 순서 확인
- ✅ **파일 저장/로드**: JSON 형식 (버전 관리)
- ✅ **보안**: Path Traversal 방지, 파일 크기 제한

## 🏗️ 아키텍처

### Hexagonal Architecture (Ports & Adapters)

```
┌─────────────────────────────────────┐
│      Presentation Layer (TODO)      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Application Layer (CQRS)       │
│  - Commands (Create, Move, Delete)  │
│  - Queries (GetBoardState)          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      🎯 Domain Layer (Pure)         │
│  - Value Objects (7)                │
│  - Entities (2)                     │
│  - Services (1)                     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Infrastructure Layer           │
│  - FileSystem, JSON, Repositories   │
└─────────────────────────────────────┘
```

## 📦 설치 및 실행

```bash
# 의존성 설치
npm install

# 테스트 실행
npm test

# 커버리지
npm run test:coverage

# Watch 모드
npm run test:watch

# 보안 점검 (배포 게이트)
npm run audit:prod

# 보안 점검 (전체 의존성 참고용)
npm run audit:all
```

## 🧪 테스트

### 전체 테스트
- **Domain Layer**: 98+ tests
- **Application Layer**: 27+ tests
- **Infrastructure Layer**: 35+ tests
- **총 160+ tests**

### 실행 방법
```bash
# 레이어별 테스트
npm test tests/domain/
npm test tests/application/
npm test tests/infrastructure/

# 특정 파일
npm test tests/domain/entities/Event.test.ts
```

## 🎯 사용 예시

```typescript
import { EventStormingBoard } from './domain/services/EventStormingBoard';
import { CreateEventHandler } from './application/commands/CreateEventHandler';
import { FileSystemBoardRepository } from './infrastructure/repositories/FileSystemBoardRepository';

// 1. 저장소 초기화
const repo = new FileSystemBoardRepository('./data');
const createHandler = new CreateEventHandler(repo);

// 2. 보드 생성
const board = EventStormingBoard.create(BoardId.generate());
await repo.save(board);

// 3. 이벤트 생성
await createHandler.handle(
  new CreateEventCommand(
    board.id.value,
    '사용자 등록됨',
    'domain-event',
    100,
    200
  )
);
```

## 🔐 보안 기능

- **Path Traversal 방지**
- **파일 크기 제한** (10MB)
- **위치 겹침 검증** (50px)
- **거리 기반 제약** (500px)

## 📐 비즈니스 규칙

### Event
- 이름: 1-200자
- 타입: domain-event, command, policy, aggregate, external-system, read-model
- 위치: 0-10000 범위 내

### Aggregate
- 이름: 1-100자
- 이벤트 간 최대 거리: 500px

## 📁 프로젝트 구조

```
event-storming-tool/
├── src/
│   ├── domain/              # 핵심 비즈니스 로직
│   ├── application/         # 유스케이스
│   ├── infrastructure/      # 외부 인터페이스
│   └── shared/              # 공통 유틸
├── tests/                   # 160+ tests
└── docs/                    # 문서
```

## 🎓 DDD 패턴

- ✅ Value Objects
- ✅ Entities
- ✅ Aggregates
- ✅ Domain Services
- ✅ Repositories
- ✅ CQRS

## 🛠️ 기술 스택

- Node.js 22.12+
- TypeScript 5+
- Vitest
- Hexagonal Architecture
- DDD, CQRS, TDD

## 📚 문서

- [프로젝트 완성 요약](./doc/development/PROJECT_COMPLETE.md)
- [Domain Layer](./doc/development/DOMAIN_LAYER_DONE.md)
- [Application Layer](./doc/development/APPLICATION_LAYER_DONE.md)
- [Infrastructure Layer](./doc/development/INFRASTRUCTURE_LAYER_DONE.md)

---

**Event Storming을 더 쉽게, 더 안전하게!** 🎉
