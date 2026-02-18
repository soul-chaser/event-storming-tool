# Event Storming Tool - 설정 가이드

## 📦 설치 및 실행

### 1. 패키지 설치
```bash
cd event-storming-tool
npm install
```

### 2. 테스트 실행
```bash
# EventName 테스트만 실행
npm test tests/domain/value-objects/EventName.test.ts

# 모든 테스트 실행
npm test

# Watch 모드
npm run test:watch
```

## 📁 프로젝트 구조

```
event-storming-tool/
├── src/
│   ├── domain/
│   │   └── value-objects/
│   │       ├── Position.ts          ✅ 완성
│   │       ├── EventName.ts         ✅ 완성
│   │       ├── EventType.ts         ✅ 완성
│   │       ├── EventId.ts           ✅ 완성
│   │       ├── AggregateId.ts       ✅ 완성
│   │       ├── AggregateName.ts     ✅ 완성
│   │       └── BoardId.ts           ✅ 완성
│   └── shared/
│       └── errors/
│           └── DomainError.ts       ✅ 완성
├── tests/
│   └── domain/
│       └── value-objects/
│           ├── EventName.test.ts    ✅ 완성
│           ├── EventType.test.ts    ✅ 완성
│           └── EventId.test.ts      ✅ 완성
├── package.json                      ✅ 완성
├── tsconfig.json                     ✅ 완성
└── vitest.config.ts                  ✅ 완성
```

## 🔧 주요 설정

### tsconfig.json
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

### package.json
```json
{
  "type": "module"  // ES Module 사용
}
```

## 🎯 다음 단계

1. ✅ EventName 테스트 통과 확인
2. 🔜 EventType 구현
3. 🔜 Event Entity 구현
4. 🔜 Aggregate Entity 구현

## 💡 TDD 워크플로우

```bash
# 1. 테스트 작성 (Red)
npm test tests/domain/value-objects/EventName.test.ts
# → 실패 ❌

# 2. 구현 (Green)
# src/domain/value-objects/EventName.ts 작성

# 3. 테스트 재실행
npm test tests/domain/value-objects/EventName.test.ts
# → 성공 ✅

# 4. 리팩터링 (Refactor)
# 코드 개선 후 테스트 재실행
```

## 🐛 자주 발생하는 문제

### 1. Module not found
**해결:** import 경로에 `.js` 확장자 추가

### 2. Cannot freeze
**해결:** 이미 freeze된 객체를 재할당하지 않도록 확인

### 3. Test timeout
**해결:** `vitest.config.ts`에서 timeout 설정 조정

```typescript
export default defineConfig({
  test: {
    testTimeout: 10000,
  },
});
```

## 📚 참고 자료

- [Vitest 문서](https://vitest.dev/)
- [TypeScript ES Modules](https://www.typescriptlang.org/docs/handbook/esm-node.html)
- [DDD Value Objects](https://martinfowler.com/bliki/ValueObject.html)