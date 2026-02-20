# Application Layer 완성! 🎉

## ✅ 완료 항목

### Commands (5개)
- ✅ CreateEventCommand + Handler
- ✅ MoveEventCommand + Handler
- ✅ DeleteEventCommand + Handler
- ✅ RenameEventCommand + Handler
- ✅ DetectAggregatesCommand + Handler

### Queries (1개)
- ✅ GetBoardStateQuery + Handler

### Infrastructure (1개)
- ✅ InMemoryEventRepository

## 📁 파일 구조

```
src/application/
├── commands/
│   ├── CreateEventCommand.ts
│   ├── CreateEventHandler.ts
│   ├── MoveEventCommand.ts
│   ├── MoveEventHandler.ts
    │   ├── DeleteEventCommand.ts
    │   ├── DeleteEventHandler.ts
    │   ├── RenameEventCommand.ts
    │   ├── RenameEventHandler.ts
    │   ├── DetectAggregatesCommand.ts
    │   └── DetectAggregatesHandler.ts
└── queries/
    ├── GetBoardStateQuery.ts
    └── GetBoardStateHandler.ts

src/infrastructure/
└── repositories/
    └── InMemoryEventRepository.ts

tests/application/
├── commands/
│   ├── CreateEventHandler.test.ts
│   ├── MoveEventHandler.test.ts
│   ├── DeleteEventHandler.test.ts
│   └── DetectAggregatesHandler.test.ts
└── queries/
    └── GetBoardStateHandler.test.ts
```

## 🧪 테스트 커버리지

### CreateEventHandler (5 tests)
- ✅ 새로운 이벤트를 생성할 수 있다
- ✅ description을 포함하여 생성할 수 있다
- ✅ 유효하지 않은 이벤트 타입은 에러를 발생시킨다
- ✅ 존재하지 않는 보드에는 이벤트를 추가할 수 없다

### MoveEventHandler (5 tests)
- ✅ 이벤트를 새로운 위치로 이동할 수 있다
- ✅ 보드 경계를 벗어나는 위치로는 이동할 수 없다
- ✅ 다른 이벤트와 겹치는 위치로는 이동할 수 없다
- ✅ 존재하지 않는 이벤트는 이동할 수 없다
- ✅ 존재하지 않는 보드에서는 이동할 수 없다

### DeleteEventHandler (5 tests)
- ✅ 이벤트를 삭제할 수 있다
- ✅ 여러 이벤트 중 하나만 삭제할 수 있다
- ✅ 존재하지 않는 이벤트는 삭제할 수 없다
- ✅ 존재하지 않는 보드에서는 삭제할 수 없다
- ✅ 이미 삭제된 이벤트를 다시 삭제할 수 없다

### RenameEventHandler (3 tests)
- ✅ 이벤트 이름을 변경할 수 있다
- ✅ 빈 이름으로 변경할 수 없다
- ✅ 존재하지 않는 이벤트는 변경할 수 없다

### DetectAggregatesHandler (5 tests)
- ✅ 근접한 이벤트들을 Aggregate로 그룹화한다
- ✅ 이벤트가 없으면 Aggregate도 없다
- ✅ 단일 이벤트도 Aggregate가 된다
- ✅ 존재하지 않는 보드에서는 감지할 수 없다
- ✅ Aggregate 감지 후 저장된다

### GetBoardStateHandler (7 tests)
- ✅ 빈 보드 상태를 조회할 수 있다
- ✅ 이벤트가 있는 보드 상태를 조회할 수 있다
- ✅ EventDTO에 모든 필수 정보가 포함된다
- ✅ Aggregate가 있는 보드 상태를 조회할 수 있다
- ✅ AggregateDTO에 모든 필수 정보가 포함된다
- ✅ 존재하지 않는 보드는 조회할 수 없다
- ✅ 여러 이벤트와 Aggregate가 있는 복잡한 보드를 조회할 수 있다

**총 30개 테스트**

## 🎯 CQRS 패턴

### Commands (쓰기)
```typescript
// 이벤트 생성
const createCmd = new CreateEventCommand(boardId, '사용자 등록됨', 'domain-event', 100, 200);
await createHandler.handle(createCmd);

// 이벤트 이동
const moveCmd = new MoveEventCommand(boardId, eventId, 300, 400);
await moveHandler.handle(moveCmd);

// 이벤트 삭제
const deleteCmd = new DeleteEventCommand(boardId, eventId);
await deleteHandler.handle(deleteCmd);

// Aggregate 감지
const detectCmd = new DetectAggregatesCommand(boardId);
await detectHandler.handle(detectCmd);
```

### Queries (읽기)
```typescript
// 보드 상태 조회
const query = new GetBoardStateQuery(boardId);
const state: BoardStateDTO = await queryHandler.handle(query);
```

## 🧪 테스트 실행

```bash
npm test tests/application/
```

## 📊 진행률

```
✅ Domain Layer       100%
✅ Application Layer  100%
✅ Infrastructure     100%
✅ Presentation       100%
```
