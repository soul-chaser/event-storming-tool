import React, { useRef, useState, useEffect, useCallback } from 'react';
import { EventStormingCanvas } from './components/EventStormingCanvas';
import { Toolbar } from './components/Toolbar';
import { EVENT_TYPE_DEFINITIONS, getDefaultEventNameByType } from './constants/eventTypeDefinitions';
import { getEventCardDimensions } from '@shared/utils/eventCardLayout';
import './App.css';

export interface EventDTO {
    id: string;
    name: string;
    type: string;
    position: { x: number; y: number };
    description?: string;
    color: string;
}

export interface AggregateDTO {
    id: string;
    name: string;
    eventIds: string[];
    bounds?: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
}

export interface BoardState {
    id: string;
    events: EventDTO[];
    aggregates: AggregateDTO[];
    connections: CardConnection[];
}

export interface CardConnection {
    sourceId: string;
    targetId: string;
}

interface BoardSummary {
    id: string;
    name: string;
    fileName: string;
    updatedAt: string;
}

type ExportFormat = 'mermaid' | 'plantuml' | 'pdf' | 'png';
const HISTORY_LIMIT = 50;

function App() {
    const canvasExportRef = useRef<{ toPNGDataURL: () => string | null } | null>(null);
    const renameInputRef = useRef<HTMLTextAreaElement | null>(null);
    const [boardId, setBoardId] = useState<string>('');
    const [boardState, setBoardState] = useState<BoardState | null>(null);
    const [selectedTool, setSelectedTool] = useState<string>('domain-event');
    const [storagePath, setStoragePath] = useState<string>('');
    const [boards, setBoards] = useState<BoardSummary[]>([]);
    const [isStartupModalOpen, setIsStartupModalOpen] = useState<boolean>(true);
    const [startupMode, setStartupMode] = useState<'select' | 'create'>('select');
    const [selectedBoardId, setSelectedBoardId] = useState<string>('');
    const [newBoardName, setNewBoardName] = useState<string>('');
    const [startupError, setStartupError] = useState<string>('');
    const [isStartupLoading, setIsStartupLoading] = useState<boolean>(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
    const [pendingStoragePath, setPendingStoragePath] = useState<string>('');
    const [settingsError, setSettingsError] = useState<string>('');
    const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
    const [pendingEventName, setPendingEventName] = useState<string>('');
    const [renameError, setRenameError] = useState<string>('');
    const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
    const [isArrowMode, setIsArrowMode] = useState<boolean>(false);
    const [undoStack, setUndoStack] = useState<string[]>([]);
    const [redoStack, setRedoStack] = useState<string[]>([]);

    const resetHistory = useCallback(() => {
        setUndoStack([]);
        setRedoStack([]);
    }, []);

    const loadBoardState = useCallback(async (id: string) => {
        try {
            const state = await window.electronAPI.getBoardState({ boardId: id });
            setBoardState(state);
            const nextIds = new Set(state.events.map((event: EventDTO) => event.id));
            setSelectedEventIds((previous) => previous.filter((eventId) => nextIds.has(eventId)));
        } catch (error) {
            console.error('Failed to load board state:', error);
        }
    }, []);

    useEffect(() => {
        void initializeStartupFlow();
    }, []);

    const initializeStartupFlow = async () => {
        setIsStartupLoading(true);
        setStartupError('');
        try {
            const config = await window.electronAPI.getConfig();
            setStoragePath(config.boardsPath);
            setPendingStoragePath(config.boardsPath);

            const listedBoards = await window.electronAPI.listBoards();
            setBoards(listedBoards);

            if (listedBoards.length === 0) {
                setStartupMode('create');
                setSelectedBoardId('');
            } else {
                setStartupMode('select');
                setSelectedBoardId(listedBoards[0].id);
            }

            setIsStartupModalOpen(true);
        } catch (error) {
            console.error('Failed to initialize board:', error);
            setStartupError('초기 데이터 로드에 실패했습니다.');
        } finally {
            setIsStartupLoading(false);
        }
    };

    const runMutationWithHistory = useCallback(async (
        mutation: () => Promise<void>,
        options?: { preserveRedo?: boolean }
    ) => {
        if (!boardId) return;

        try {
            const beforeSnapshot = await window.electronAPI.getBoardSnapshot({ boardId });
            await mutation();
            const afterSnapshot = await window.electronAPI.getBoardSnapshot({ boardId });
            if (beforeSnapshot !== afterSnapshot) {
                setUndoStack((previous) => [...previous.slice(-(HISTORY_LIMIT - 1)), beforeSnapshot]);
                if (!options?.preserveRedo) {
                    setRedoStack([]);
                }
            }
            await loadBoardState(boardId);
        } catch (error) {
            console.error('Failed to apply mutation:', error);
        }
    }, [boardId, loadBoardState]);

    const handleCreateEvent = async (x: number, y: number) => {
        if (!boardId) return;

        await runMutationWithHistory(async () => {
            await window.electronAPI.createEvent({
                boardId,
                name: getDefaultEventNameByType(selectedTool),
                type: selectedTool,
                x,
                y,
            });
        });
    };

    const handleMoveEvents = async (moves: Array<{ eventId: string; x: number; y: number }>) => {
        if (!boardId || !boardState || moves.length === 0) return;

        const nextPositions = new Map(moves.map((move) => [move.eventId, { x: move.x, y: move.y }]));
        const nextEvents = boardState.events.map((event) => {
            const nextPosition = nextPositions.get(event.id);
            return nextPosition ? { ...event, position: nextPosition } : event;
        });

        const hasInvalidMove = nextEvents.some((event) => isOutOfBounds(event.position.x, event.position.y));
        if (hasInvalidMove || hasAnyCardOverlap(nextEvents)) {
            await loadBoardState(boardId);
            return;
        }

        await runMutationWithHistory(async () => {
            const snapshot = await window.electronAPI.getBoardSnapshot({ boardId });
            const parsed = JSON.parse(snapshot) as {
                events: Array<{ id: string; position: { x: number; y: number } }>;
            };

            parsed.events = parsed.events.map((event) => {
                const nextPosition = nextPositions.get(event.id);
                if (!nextPosition) {
                    return event;
                }
                return {
                    ...event,
                    position: {
                        x: nextPosition.x,
                        y: nextPosition.y,
                    },
                };
            });

            await window.electronAPI.replaceBoardSnapshot({
                boardId,
                snapshot: JSON.stringify(parsed, null, 2),
            });
        });
    };

    const handleDeleteSelectedCards = async () => {
        if (!boardId || selectedEventIds.length === 0) return;

        const targetIds = [...selectedEventIds];
        await runMutationWithHistory(async () => {
            for (const eventId of targetIds) {
                await window.electronAPI.deleteEvent({
                    boardId,
                    eventId,
                });
            }
        });
        setSelectedEventIds([]);
    };

    const handleRenameEvent = async (eventId: string, newName: string) => {
        if (!boardId) return;

        await runMutationWithHistory(async () => {
            await window.electronAPI.renameEvent({
                boardId,
                eventId,
                newName,
            });
        });
    };

    const handleRenameSelectedCard = async () => {
        if (!boardId || !boardState || selectedEventIds.length !== 1) {
            window.alert('먼저 이름을 변경할 카드를 선택하세요.');
            return;
        }

        const selectedEvent = boardState.events.find((event) => event.id === selectedEventIds[0]);
        if (!selectedEvent) {
            window.alert('선택된 카드를 찾을 수 없습니다. 다시 선택 후 시도하세요.');
            return;
        }

        setPendingEventName(selectedEvent.name);
        setRenameError('');
        setIsRenameModalOpen(true);
    };

    const handleSaveCardName = async () => {
        if (!boardId || selectedEventIds.length !== 1) {
            setRenameError('선택된 카드가 없습니다.');
            return;
        }

        const nextName = pendingEventName.trim();
        if (!nextName) {
            setRenameError('카드 이름은 비어 있을 수 없습니다.');
            return;
        }

        await runMutationWithHistory(async () => {
            await window.electronAPI.renameEvent({
                boardId,
                eventId: selectedEventIds[0],
                newName: nextName,
            });
        });

        setIsRenameModalOpen(false);
        setRenameError('');
    };

    const handleCloseRenameModal = () => {
        setIsRenameModalOpen(false);
        setRenameError('');
    };

    useEffect(() => {
        if (!isRenameModalOpen) {
            return;
        }

        renameInputRef.current?.focus();
        renameInputRef.current?.select();
    }, [isRenameModalOpen]);

    const handleDetectAggregates = async () => {
        if (!boardId) return;

        await runMutationWithHistory(async () => {
            await window.electronAPI.detectAggregates({ boardId });
        });
    };

    const handleStartArrowMode = () => {
        if (selectedEventIds.length === 0) {
            window.alert('먼저 출발 카드들을 선택하세요.');
            return;
        }
        setIsArrowMode(true);
    };

    const handleArrowTargetSelect = (targetId: string) => {
        if (!isArrowMode || selectedEventIds.length === 0) {
            return;
        }
        if (selectedEventIds.includes(targetId)) {
            return;
        }

        const toAdd = selectedEventIds.map((sourceId) => ({ sourceId, targetId }));
        void runMutationWithHistory(async () => {
            const snapshot = await window.electronAPI.getBoardSnapshot({ boardId });
            const parsed = JSON.parse(snapshot) as {
                connections?: CardConnection[];
            };
            const existing = parsed.connections ?? [];
            const dedup = new Set(existing.map((connection) => `${connection.sourceId}->${connection.targetId}`));
            for (const connection of toAdd) {
                const key = `${connection.sourceId}->${connection.targetId}`;
                if (!dedup.has(key)) {
                    existing.push(connection);
                    dedup.add(key);
                }
            }

            parsed.connections = existing;
            await window.electronAPI.replaceBoardSnapshot({
                boardId,
                snapshot: JSON.stringify(parsed, null, 2),
            });
        });
        setIsArrowMode(false);
    };

    const handleUndo = useCallback(async () => {
        if (!boardId || undoStack.length === 0) return;

        const targetSnapshot = undoStack[undoStack.length - 1];

        try {
            const currentSnapshot = await window.electronAPI.getBoardSnapshot({ boardId });
            await window.electronAPI.replaceBoardSnapshot({
                boardId,
                snapshot: targetSnapshot,
            });
            setUndoStack((previous) => previous.slice(0, -1));
            setRedoStack((previous) => [...previous.slice(-(HISTORY_LIMIT - 1)), currentSnapshot]);
            await loadBoardState(boardId);
        } catch (error) {
            console.error('Failed to undo:', error);
        }
    }, [boardId, undoStack, loadBoardState]);

    const handleRedo = useCallback(async () => {
        if (!boardId || redoStack.length === 0) return;

        const targetSnapshot = redoStack[redoStack.length - 1];

        try {
            const currentSnapshot = await window.electronAPI.getBoardSnapshot({ boardId });
            await window.electronAPI.replaceBoardSnapshot({
                boardId,
                snapshot: targetSnapshot,
            });
            setRedoStack((previous) => previous.slice(0, -1));
            setUndoStack((previous) => [...previous.slice(-(HISTORY_LIMIT - 1)), currentSnapshot]);
            await loadBoardState(boardId);
        } catch (error) {
            console.error('Failed to redo:', error);
        }
    }, [boardId, redoStack, loadBoardState]);

    const handleImportBoard = useCallback(async () => {
        try {
            const filePath = await window.electronAPI.chooseImportPath();
            if (!filePath) {
                return;
            }

            const imported = await window.electronAPI.importBoardJSON({
                filePath,
                targetBoardId: boardId || undefined,
            });
            const listedBoards = await window.electronAPI.listBoards();
            setBoards(listedBoards);
            setBoardId(imported.boardId);
            setSelectedBoardId(imported.boardId);
            setIsStartupModalOpen(false);
            setSelectedEventIds([]);
            setIsArrowMode(false);
            resetHistory();
            await loadBoardState(imported.boardId);
        } catch (error) {
            console.error('Failed to import board:', error);
            window.alert('JSON import에 실패했습니다. 파일 형식을 확인하세요.');
        }
    }, [boardId, loadBoardState, resetHistory]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            const isPrimaryModifier = event.metaKey || event.ctrlKey;

            if (isRenameModalOpen) {
                if (key === 'escape') {
                    event.preventDefault();
                    handleCloseRenameModal();
                    return;
                }

                if (isPrimaryModifier && key === 'enter') {
                    event.preventDefault();
                    void handleSaveCardName();
                    return;
                }
            }

            const target = event.target as HTMLElement | null;
            const isTextInput = target
                ? target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target.isContentEditable
                : false;

            if (isTextInput) {
                return;
            }

            if (isPrimaryModifier && key === 'z') {
                event.preventDefault();
                if (event.shiftKey) {
                    void handleRedo();
                } else {
                    void handleUndo();
                }
                return;
            }

            if (isPrimaryModifier && key === 'y') {
                event.preventDefault();
                void handleRedo();
                return;
            }

            if (isPrimaryModifier && key === 'i') {
                event.preventDefault();
                void handleImportBoard();
                return;
            }

            if (isPrimaryModifier && key === 'e') {
                event.preventDefault();
                void handleRenameSelectedCard();
                return;
            }

            if (isPrimaryModifier && key === 'l') {
                event.preventDefault();
                handleStartArrowMode();
                return;
            }

            if (key === 'delete' || key === 'backspace') {
                event.preventDefault();
                void handleDeleteSelectedCards();
                return;
            }

            if (isPrimaryModifier && /^[1-6]$/.test(key)) {
                event.preventDefault();
                const selected = EVENT_TYPE_DEFINITIONS[Number(key) - 1];
                if (selected) {
                    setSelectedTool(selected.value);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleImportBoard, handleRedo, handleRenameSelectedCard, handleUndo, isRenameModalOpen, handleDeleteSelectedCards, selectedEventIds]);

    const handleChangeStoragePath = async () => {
        setPendingStoragePath(storagePath);
        setSettingsError('');
        setIsSettingsModalOpen(true);
    };

    const handleExport = async (format: ExportFormat) => {
        if (!boardId || !boardState) {
            return;
        }

        try {
            const outputPath = await window.electronAPI.chooseExportPath({ boardId, format });
            if (!outputPath) {
                return;
            }

            const imageDataUrl = (format === 'pdf' || format === 'png')
                ? canvasExportRef.current?.toPNGDataURL() ?? undefined
                : undefined;

            await window.electronAPI.exportBoard({
                boardId,
                format,
                outputPath,
                imageDataUrl,
            });
        } catch (error) {
            console.error(`Failed to export ${format}:`, error);
            window.alert(`${format.toUpperCase()} export에 실패했습니다.`);
        }
    };

    const handleSaveStoragePath = async () => {
        const trimmedPath = pendingStoragePath.trim();
        if (!trimmedPath) {
            setSettingsError('저장 경로는 비어 있을 수 없습니다.');
            return;
        }

        try {
            const updated = await window.electronAPI.updateBoardsPath({ boardsPath: trimmedPath });
            setStoragePath(updated.boardsPath);
            setIsSettingsModalOpen(false);
            setBoardId('');
            setBoardState(null);
            setSelectedEventIds([]);
            setIsArrowMode(false);
            resetHistory();
            await initializeStartupFlow();
        } catch (error) {
            console.error('Failed to change storage path:', error);
            setSettingsError('저장 경로 변경에 실패했습니다.');
        }
    };

    const handleOpenSelectedBoard = async () => {
        if (!selectedBoardId) {
            setStartupError('이어갈 Event Storming을 선택하세요.');
            return;
        }

        setIsStartupLoading(true);
        setStartupError('');
        try {
            setBoardId(selectedBoardId);
            setSelectedEventIds([]);
            setIsArrowMode(false);
            resetHistory();
            await loadBoardState(selectedBoardId);
            setIsStartupModalOpen(false);
        } catch (error) {
            console.error('Failed to open board:', error);
            setStartupError('선택한 Event Storming을 열 수 없습니다.');
        } finally {
            setIsStartupLoading(false);
        }
    };

    const handleCreateBoard = async () => {
        const trimmedName = newBoardName.trim();
        if (!trimmedName) {
            setStartupError('Event Storming 이름을 입력하세요.');
            return;
        }

        setIsStartupLoading(true);
        setStartupError('');
        try {
            const createdBoardId = await window.electronAPI.createBoard({ name: trimmedName });
            const listedBoards = await window.electronAPI.listBoards();
            setBoards(listedBoards);
            setBoardId(createdBoardId);
            setSelectedEventIds([]);
            setIsArrowMode(false);
            resetHistory();
            await loadBoardState(createdBoardId);
            setNewBoardName('');
            setSelectedBoardId(createdBoardId);
            setIsStartupModalOpen(false);
        } catch (error) {
            console.error('Failed to create board:', error);
            setStartupError('Event Storming 생성에 실패했습니다.');
        } finally {
            setIsStartupLoading(false);
        }
    };

    return (
        <div className="app">
            <Toolbar
                selectedTool={selectedTool}
                onToolChange={setSelectedTool}
                onDetectAggregates={handleDetectAggregates}
                onImportBoard={handleImportBoard}
                onDeleteSelectedCards={handleDeleteSelectedCards}
                canDeleteSelection={selectedEventIds.length > 0}
                onStartArrowMode={handleStartArrowMode}
                isArrowMode={isArrowMode}
                onExport={handleExport}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={undoStack.length > 0}
                canRedo={redoStack.length > 0}
                onRenameCard={handleRenameSelectedCard}
                storagePath={storagePath}
                onChangeStoragePath={handleChangeStoragePath}
            />
            <EventStormingCanvas
                boardState={boardState}
                onCreateEvent={handleCreateEvent}
                onMoveEvents={handleMoveEvents}
                onRenameEvent={handleRenameEvent}
                selectedEventIds={selectedEventIds}
                onSelectionChange={setSelectedEventIds}
                isArrowMode={isArrowMode}
                onArrowTargetSelect={handleArrowTargetSelect}
                connections={boardState?.connections ?? []}
                onCanvasReady={(api) => {
                    canvasExportRef.current = api;
                }}
            />
            {isStartupModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal startup-modal">
                        <h2>Event Storming 시작</h2>
                        <p className="modal-description">
                            이어서 작업하거나 새 Event Storming을 시작하세요.
                        </p>
                        <div className="modal-meta">
                            <span>저장 경로:</span>
                            <code>{storagePath || '-'}</code>
                            <button className="inline-link" onClick={handleChangeStoragePath}>변경</button>
                        </div>

                        {startupMode === 'select' && boards.length > 0 && (
                            <>
                                <div className="board-list">
                                    {boards.map((board) => (
                                        <label key={board.id} className="board-item">
                                            <input
                                                type="radio"
                                                name="board"
                                                checked={selectedBoardId === board.id}
                                                onChange={() => setSelectedBoardId(board.id)}
                                            />
                                            <div className="board-item-text">
                                                <strong>{board.name}</strong>
                                                <span>{formatBoardDate(board.updatedAt)}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <div className="modal-actions">
                                    <button
                                        className="primary"
                                        onClick={handleOpenSelectedBoard}
                                        disabled={isStartupLoading}
                                    >
                                        이어서 진행
                                    </button>
                                    <button
                                        className="secondary"
                                        onClick={() => {
                                            setStartupError('');
                                            setStartupMode('create');
                                        }}
                                        disabled={isStartupLoading}
                                    >
                                        새로 시작
                                    </button>
                                </div>
                            </>
                        )}

                        {startupMode === 'create' && (
                            <>
                                <div className="field-group">
                                    <label htmlFor="board-name-input">Event Storming 이름</label>
                                    <input
                                        id="board-name-input"
                                        type="text"
                                        value={newBoardName}
                                        onChange={(e) => setNewBoardName(e.currentTarget.value)}
                                        placeholder="예: 주문 결제 플로우"
                                        disabled={isStartupLoading}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button
                                        className="primary"
                                        onClick={handleCreateBoard}
                                        disabled={isStartupLoading}
                                    >
                                        생성 후 시작
                                    </button>
                                    {boards.length > 0 && (
                                        <button
                                            className="secondary"
                                            onClick={() => {
                                                setStartupError('');
                                                setStartupMode('select');
                                            }}
                                            disabled={isStartupLoading}
                                        >
                                            기존 목록으로
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {startupError && <p className="modal-error">{startupError}</p>}
                    </div>
                </div>
            )}
            {isSettingsModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal settings-modal">
                        <h2>저장 경로 설정</h2>
                        <p className="modal-description">Board 파일 저장 위치를 지정합니다.</p>
                        <div className="field-group">
                            <label htmlFor="storage-path-input">저장 경로</label>
                            <input
                                id="storage-path-input"
                                type="text"
                                value={pendingStoragePath}
                                onChange={(e) => setPendingStoragePath(e.currentTarget.value)}
                            />
                        </div>
                        {settingsError && <p className="modal-error">{settingsError}</p>}
                        <div className="modal-actions">
                            <button className="primary" onClick={handleSaveStoragePath}>저장</button>
                            <button className="secondary" onClick={() => setIsSettingsModalOpen(false)}>취소</button>
                        </div>
                    </div>
                </div>
            )}
            {isRenameModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal settings-modal">
                        <h2>카드 이름 변경</h2>
                        <p className="modal-description">선택한 카드의 이름을 변경합니다.</p>
                        <div className="field-group">
                            <label htmlFor="event-name-input">카드 이름</label>
                            <textarea
                                id="event-name-input"
                                ref={renameInputRef}
                                value={pendingEventName}
                                onChange={(e) => setPendingEventName(e.currentTarget.value)}
                                rows={4}
                            />
                        </div>
                        {renameError && <p className="modal-error">{renameError}</p>}
                        <div className="modal-actions">
                            <button className="primary" onClick={handleSaveCardName}>저장 (Cmd/Ctrl+Enter)</button>
                            <button className="secondary" onClick={handleCloseRenameModal}>취소 (Esc)</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;

function formatBoardDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '수정일 알 수 없음';
    }
    return `최근 수정: ${date.toLocaleString()}`;
}

function isOutOfBounds(x: number, y: number): boolean {
    return x < 0 || y < 0 || x > 10000 || y > 10000;
}

function hasAnyCardOverlap(events: EventDTO[]): boolean {
    for (let i = 0; i < events.length; i++) {
        const a = events[i];
        const aDimensions = getEventCardDimensions(a.name);
        const aBounds = {
            left: a.position.x,
            top: a.position.y,
            right: a.position.x + aDimensions.width,
            bottom: a.position.y + aDimensions.height,
        };

        for (let j = i + 1; j < events.length; j++) {
            const b = events[j];
            const bDimensions = getEventCardDimensions(b.name);
            const bBounds = {
                left: b.position.x,
                top: b.position.y,
                right: b.position.x + bDimensions.width,
                bottom: b.position.y + bDimensions.height,
            };

            const separated =
                aBounds.right <= bBounds.left ||
                aBounds.left >= bBounds.right ||
                aBounds.bottom <= bBounds.top ||
                aBounds.top >= bBounds.bottom;

            if (!separated) {
                return true;
            }
        }
    }
    return false;
}
