# Event Storming Tool - TDD 테스트 가이드

## 📦 설치
```bash
npm install
```

## 🧪 테스트 실행

### 모든 테스트 실행
```bash
npm test
```

### Watch 모드 (개발 시 추천)
```bash
npm run test:watch
```

### Domain Layer만 테스트
```bash
npm run test:domain
```

### Coverage 리포트 생성
```bash
npm run test:coverage
```

### UI 모드 (시각적 테스트 러너)
```bash
npm run test:ui
```

## 📁 테스트 구조
```
tests/
├── domain/
│   ├── value-objects/
│   │   ├── Position.test.ts           ✅ 완료
│   │   ├── EventType.test.ts          ✅ 완료
│   │   ├── EventName.test.ts          ✅ 완료
│   │   ├── EventId.test.ts            🔜 다음
│   │   └── AggregateName.test.ts      🔜 다음
│   ├── entities/
│   │   ├── Event.test.ts              ✅ 완료
│   │   └── Aggregate.test.ts          ✅ 완료
│   └── services/
│       ├── EventStormingBoard.test.ts ✅ 완료
│       ├── FlowValidator.test.ts      🔜 다음
│       └── AggregateDetector.test.ts  🔜 다음
```

## 🎯 TDD 개발 흐름

### Red-Green-Refactor Cycle

1. **🔴 Red: 실패하는 테스트 작성**
```typescript
   it('유효한 좌표로 Position을 생성할 수 있다', () => {
     const position = new Position(100, 200);
     expect(position.x).toBe(100);
   });
```
→ 아직 구현 안됨, 테스트 실패 ❌

2. **🟢 Green: 최소한의 코드로 테스트 통과**
```typescript
   class Position {
     constructor(public readonly x: number, public readonly y: number) {}
   }
```
→ 테스트 통과 ✅

3. **🔵 Refactor: 코드 개선**
```typescript
   class Position {
     constructor(
       public readonly x: number,
       public readonly y: number
     ) {
       if (x < 0 || y < 0) {
         throw new DomainError('Position cannot be negative');
       }
       Object.freeze(this); // 불변성 보장
     }
   }
```
→ 테스트 여전히 통과 ✅, 코드 품질 향상 📈

## 📊 테스트 커버리지 목표

| 계층 | 목표 커버리지 | 현재 상태 |
|------|--------------|----------|
| Domain (Value Objects) | 100% | 🟢 달성 |
| Domain (Entities) | 100% | 🟢 달성 |
| Domain (Services) | 95%+ | 🟡 진행 중 |
| Application | 90%+ | ⚪ 미시작 |
| Infrastructure | 80%+ | ⚪ 미시작 |

## ✅ 테스트 작성 체크리스트

### Value Object 테스트
- [ ] 유효한 값으로 생성 가능
- [ ] 유효하지 않은 값은 DomainError 발생
- [ ] 경계값 테스트 (0, 최대값, 음수 등)
- [ ] equals() 메서드 동작
- [ ] 불변성 보장
- [ ] 비즈니스 메서드 동작

### Entity 테스트
- [ ] 유효한 속성으로 생성 가능
- [ ] ID 기반 동일성 (equals)
- [ ] 비즈니스 메서드 동작
- [ ] 상태 변경 시 검증 로직
- [ ] 불변 규칙 검증
- [ ] 도메인 이벤트 발행 (있는 경우)

### Domain Service 테스트
- [ ] 핵심 비즈니스 로직 검증
- [ ] 여러 Entity 간 상호작용
- [ ] 복잡한 비즈니스 규칙 검증
- [ ] 예외 상황 처리
- [ ] 성능 임계 케이스

## 🚀 다음 구현 단계

### 1단계: 남은 Value Objects (예상 시간: 2시간)
```bash
# 테스트 먼저 작성
tests/domain/value-objects/EventId.test.ts
tests/domain/value-objects/AggregateId.test.ts
tests/domain/value-objects/AggregateName.test.ts
tests/domain/value-objects/BoardId.test.ts

# 그 다음 구현
src/domain/value-objects/EventId.ts
src/domain/value-objects/AggregateId.ts
src/domain/value-objects/AggregateName.ts
src/domain/value-objects/BoardId.ts
```

### 2단계: 남은 Domain Services (예상 시간: 3시간)
```bash
tests/domain/services/FlowValidator.test.ts
tests/domain/services/AggregateDetector.test.ts

src/domain/services/FlowValidator.ts
src/domain/services/AggregateDetector.ts
```

### 3단계: Shared Errors (예상 시간: 1시간)
```bash
tests/shared/errors/DomainError.test.ts

src/shared/errors/DomainError.ts
src/shared/errors/ValidationError.ts
```

## 💡 TDD 팁

### 1. 테스트는 문서다
```typescript
// ✅ Good: 의도가 명확한 테스트 이름
it('음수 x 좌표는 DomainError를 발생시킨다', () => {
  expect(() => new Position(-1, 100)).toThrow(DomainError);
});

// ❌ Bad: 모호한 테스트 이름
it('에러 테스트', () => {
  expect(() => new Position(-1, 100)).toThrow();
});
```

### 2. AAA 패턴 사용
```typescript
it('이벤트를 이동할 수 있다', () => {
  // Arrange (준비)
  const event = Event.create({...});
  const newPosition = new Position(300, 400);
  
  // Act (실행)
  event.moveTo(newPosition);
  
  // Assert (검증)
  expect(event.position.equals(newPosition)).toBe(true);
});
```

### 3. 하나의 테스트는 하나의 것만 검증
```typescript
// ✅ Good
it('유효한 좌표로 생성할 수 있다', () => {
  const position = new Position(100, 200);
  expect(position.x).toBe(100);
  expect(position.y).toBe(200);
});

it('음수 x는 DomainError를 발생시킨다', () => {
  expect(() => new Position(-1, 100)).toThrow(DomainError);
});

// ❌ Bad: 여러 것을 한번에 테스트
it('Position 테스트', () => {
  const position = new Position(100, 200);
  expect(position.x).toBe(100);
  expect(() => new Position(-1, 100)).toThrow();
  expect(position.distanceTo(new Position(0, 0))).toBeGreaterThan(0);
});
```

### 4. 도메인 용어 사용
```typescript
// ✅ Good: 도메인 언어 사용
describe('EventStormingBoard (Domain Service)', () => {
  it('근접한 이벤트들을 Aggregate로 그룹화한다', () => {
    // ...
  });
});

// ❌ Bad: 기술 용어만 사용
describe('Board', () => {
  it('클러스터링 알고리즘 테스트', () => {
    // ...
  });
});
```

## 🐛 디버깅

### 특정 테스트만 실행
```typescript
// .only 사용
it.only('이 테스트만 실행', () => {
  // ...
});
```

### 특정 테스트 건너뛰기
```typescript
// .skip 사용
it.skip('이 테스트는 건너뜀', () => {
  // ...
});
```

### 테스트 실패 시 상세 정보
```bash
npm test -- --reporter=verbose
```

## 📚 참고 자료

- [Vitest 문서](https://vitest.dev/)
- [TDD by Example - Kent Beck](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Domain-Driven Design - Eric Evans](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)