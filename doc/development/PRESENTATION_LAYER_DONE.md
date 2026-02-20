# Presentation Layer 현행화 (2026-02) ✅

## ✅ 완료 항목

### Electron (4개)
- ✅ main.ts (메인 프로세스)
- ✅ preload.ts (보안 브리지)
- ✅ ipcHandlers.ts (IPC 통신)
- ✅ AppConfigStore.ts (설정 저장소)

### React Components (3개)
- ✅ App.tsx (메인 컴포넌트)
- ✅ EventStormingCanvas.tsx (Konva 캔버스)
- ✅ Toolbar.tsx (도구 모음)

### Styles (2개)
- ✅ App.css
- ✅ Toolbar.css

## 📁 파일 구조

```
src/presentation/
├── electron/
│   ├── main.ts              # Electron 메인 프로세스
│   ├── preload.ts           # 보안 브리지
│   ├── ipcHandlers.ts       # IPC 핸들러
│   └── AppConfigStore.ts    # ~/.event_storming_tool/.config 관리
└── react/
    ├── App.tsx              # 메인 컴포넌트
    ├── App.css
    ├── main.tsx             # React 진입점
    └── components/
        ├── EventStormingCanvas.tsx
        ├── Toolbar.tsx
        └── Toolbar.css

tests/presentation/
└── electron/
    └── main.test.ts

Configuration:
├── vite.config.ts           # Vite 설정
├── src/presentation/react/index.html  # HTML 템플릿
└── package.json             # 의존성 및 스크립트
```

## 🎯 주요 기능

### 1. Electron 보안 설정
```typescript
webPreferences: {
  nodeIntegration: false,      // ✅ Node.js API 분리
  contextIsolation: true,      // ✅ Context 격리
  preload: path.join(__dirname, 'preload.js')
}
```

### 2. IPC 통신
```typescript
// Preload에서 안전한 API 노출
window.electronAPI.createEvent(args);
window.electronAPI.moveEvent(args);
window.electronAPI.deleteEvent(args);
window.electronAPI.getBoardState(args);
window.electronAPI.chooseExportPath(args);
window.electronAPI.exportBoard(args);
```

### 3. React + Konva 캔버스
```typescript
// 이벤트 카드 드래그 & 드롭
<EventCard
  event={event}
  draggable
  onDragEnd={handleDragEnd}
  onDoubleClick={handleDelete}
/>

// Aggregate 배경
<AggregateBox aggregate={aggregate} />
```

### 4. 사용자 인터랙션
- ✅ 클릭으로 이벤트 생성
- ✅ 드래그로 이벤트 이동
- ✅ 더블클릭으로 이벤트 이름 편집
- ✅ 우클릭으로 이벤트 삭제
- ✅ Aggregate 자동 감지
- ✅ Export (Mermaid, PlantUML, PDF, PNG)
- ✅ 시작 모달(기존 보드 선택 / 신규 생성)
- ✅ 설정 모달(저장 경로 변경)

## 🎨 UI 구성

### Toolbar (좌측)
```
┌─────────────────┐
│ Event Types     │
│ ┌─────────────┐ │
│ │Domain Event │ │
│ │Command      │ │
│ │Policy       │ │
│ │Aggregate    │ │
│ │External Sys │ │
│ │Read Model   │ │
│ └─────────────┘ │
│                 │
│ Actions         │
│ ┌─────────────┐ │
│ │Detect Agg.  │ │
│ └─────────────┘ │
│                 │
│ Export          │
│ ┌─────────────┐ │
│ │Mermaid      │ │
│ │PlantUML     │ │
│ │PDF          │ │
│ │PNG          │ │
│ └─────────────┘ │
│                 │
│ Settings        │
│ • Storage Path  │
│                 │
│ Help            │
│ • Click: Create │
│ • Drag: Move    │
│ • DblClick: Ren │
│ • RightClick Del│
└─────────────────┘
```

### Canvas (우측)
```
┌─────────────────────────────────────┐
│                                     │
│  ┌──────────┐    ┌──────────┐      │
│  │사용자    │ →  │사용자    │      │
│  │등록      │    │등록됨    │      │
│  └──────────┘    └──────────┘      │
│                                     │
│  [Aggregate Box]                    │
│                                     │
└─────────────────────────────────────┘
```

## 🚀 실행 방법

### 개발 모드

```bash
# 1. 의존성 설치
npm install

# 2. React 개발 서버 실행
npm run dev

# 3. 다른 터미널에서 Electron 실행
npm run electron:dev
```

### 프로덕션 빌드

```bash
# 1. 빌드
npm run build

# 2. Electron 앱 패키징
npm run electron:build
```

## 🔐 보안 기능

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline';" />
```

### Context Isolation
- ✅ Renderer 프로세스와 Node.js 분리
- ✅ preload 스크립트로만 API 노출
- ✅ IPC를 통한 안전한 통신

## 📊 컴포넌트 계층

```
App
├── Toolbar
│   ├── Event Type Buttons
│   ├── Action Buttons
│   └── Help Text
└── EventStormingCanvas
    ├── Stage (Konva)
    └── Layer
        ├── AggregateBox[]
        └── EventCard[]
            ├── Rect (배경)
            └── Text (이름)
```

## 🎨 Event 카드 색상

| 타입 | 색상 | Hex |
|------|------|-----|
| Domain Event | 🟠 오렌지 | #FFA500 |
| Command | 🔵 하늘색 | #87CEEB |
| Policy | 🟣 보라색 | #DDA0DD |
| Aggregate | 🟡 노란색 | #FFD700 |
| External System | 🌸 분홍색 | #FFB6C1 |
| Read Model | 🟢 초록색 | #90EE90 |

## 💡 사용 시나리오

### 1. 앱 시작
```
앱 실행
→ 기존 보드가 있으면 선택 모달 표시
→ 없으면 신규 보드 이름 입력 모달 표시
```

### 2. 이벤트 추가
```
좌측 도구 모음에서 타입 선택 → 캔버스 클릭
```

### 3. 이벤트 배치
```
이벤트 카드 드래그하여 원하는 위치로 이동
```

### 4. Aggregate 감지
```
"Detect Aggregates" 버튼 클릭
→ 근접한 이벤트들이 자동으로 그룹화됨
```

### 5. 이벤트 삭제
```
이벤트 카드 우클릭 → 확인 → 삭제
```

### 6. 저장 경로 변경
```
Toolbar > 저장 경로 변경
→ 설정 모달에서 새 경로 입력
→ 저장 후 해당 경로의 보드 목록을 다시 표시
```

### 7. 다이어그램 내보내기
```
Toolbar > Export 형식 선택
→ 저장 경로 선택
→ Mermaid(.mmd) / PlantUML(.puml) / PDF(.pdf) / PNG(.png)로 저장
```

## 🧪 테스트

```bash
# Presentation layer 테스트
npm test tests/presentation/

# E2E 테스트 (향후 추가)
npm run test:e2e
```

## 📈 전체 진행률

```
✅ Domain Layer        100%
✅ Application Layer   100%
✅ Infrastructure      100%
✅ Presentation Layer  100%

🎉 프로젝트 100% 완성!
```

## 🚀 다음 단계 (선택사항)

### 추가 기능
- [x] Export (Mermaid, PlantUML, PDF, PNG)
- [ ] Import (JSON 파일 검증)
- [ ] Undo/Redo
- [ ] 이벤트 설명 편집
- [ ] 키보드 단축키

### 개선사항
- [ ] E2E 테스트 (Playwright)
- [ ] 성능 최적화 (대량 이벤트)
- [ ] 다크 모드
- [ ] 다국어 지원

## 🎓 기술 스택

### Frontend
- React 18
- TypeScript
- Konva.js (Canvas)
- CSS

### Desktop
- Electron 28
- IPC 통신
- Context Isolation

### Build Tools
- Vite
- Electron Builder

## 🎉 완성!

**Event Storming Tool이 완전히 작동하는 데스크톱 애플리케이션으로 완성되었습니다!**

- ✅ 모든 레이어 구현 완료
- ✅ TDD로 검증된 백엔드
- ✅ 보안이 강화된 Electron 앱
- ✅ 직관적인 React UI
- ✅ 실시간 상호작용

**이제 실제로 Event Storming을 수행할 수 있습니다!** 🚀
