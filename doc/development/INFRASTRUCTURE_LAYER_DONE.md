# Infrastructure Layer 현행화 (2026-02) ✅

## ✅ 완료 항목

### Adapters
- ✅ FileSystemAdapter (파일 시스템 접근)
- ✅ JSONSerializer (직렬화/역직렬화)

### Repositories
- ✅ InMemoryEventRepository (메모리 저장소)
- ✅ FileSystemBoardRepository (파일 저장소)
- ✅ Board index 기반 메타데이터 관리 (`.board-index.json`)

## 📁 파일 구조

```
src/infrastructure/
├── adapters/
│   ├── FileSystemAdapter.ts
│   └── JSONSerializer.ts
└── repositories/
    ├── InMemoryEventRepository.ts
    └── FileSystemBoardRepository.ts

tests/infrastructure/
├── adapters/
│   ├── FileSystemAdapter.test.ts
│   └── JSONSerializer.test.ts
└── repositories/
    └── FileSystemBoardRepository.test.ts
```

## 🧪 테스트 커버리지

### FileSystemAdapter
- ✅ 파일 저장/로드/삭제
- ✅ Path Traversal 방지
- ✅ 파일 크기 제한
- ✅ 파일 목록 조회
- ✅ 원자적 저장 (임시 파일 기록 후 rename)

### JSONSerializer
- ✅ 직렬화/역직렬화
- ✅ 버전 검증
- ✅ Round-trip 테스트

### FileSystemBoardRepository
- ✅ 보드 저장/로드/삭제
- ✅ 존재 여부 확인
- ✅ 전체 목록 조회
- ✅ 보드 이름/수정시각 관리
- ✅ 레거시 UUID 파일 fallback 로딩

**총 35개 테스트**

## 🎯 주요 기능

### FileSystemAdapter
```typescript
const adapter = new FileSystemAdapter('./data');

// 파일 저장 (Path Traversal 방지)
await adapter.saveFile('board.json', content);

// 파일 로드 (크기 제한 10MB)
const content = await adapter.loadFile('board.json');

// 파일 목록
const files = await adapter.listFiles('.json');
```

원자적 저장은 내부적으로 다음 순서로 처리됩니다.
1. `<filename>.tmp`에 먼저 저장
2. `rename`으로 최종 파일 치환

### JSONSerializer
```typescript
const serializer = new JSONSerializer();

// 직렬화
const json = serializer.serialize(board);

// 역직렬화
const board = serializer.deserialize(json);
```

### FileSystemBoardRepository
```typescript
const repo = new FileSystemBoardRepository('./data');

// 저장
await repo.save(board);

// 로드
const board = await repo.load(boardId);

// 전체 목록
const ids = await repo.listAll();
```

보드 이름 기반 파일명 및 메타데이터 등록:
```typescript
await repo.registerBoardName(board.id, '주문 결제 플로우');
await repo.save(board);
const boards = await repo.listBoards(); // [{ id, name, fileName, updatedAt }]
```

## 🔐 보안 기능

### Path Traversal 방지
```typescript
// ❌ 공격 차단
await adapter.saveFile('../../../etc/passwd', 'hack');
// → DomainError

// ✅ 안전한 경로만 허용
await adapter.saveFile('board.json', content);
```

### 파일 크기 제한
```typescript
// 10MB 초과 파일은 로드 불가
await adapter.loadFile('huge-file.json');
// → DomainError
```

## 📊 현재 상태

- 저장소는 변경 시점마다 파일에 즉시 저장됩니다.
- 저장 경로는 앱 설정(`~/.event_storming_tool/.config`)으로 관리됩니다.
- 보드 파일 기본 저장 위치는 `~/.event_storming_tool/boards` 입니다.

## 🧪 테스트 실행

```bash
npm test tests/infrastructure/
```
