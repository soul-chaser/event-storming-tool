import React, { useState, useEffect } from 'react';
import { EventStormingCanvas } from './components/EventStormingCanvas';
import { Toolbar } from './components/Toolbar';
import { getDefaultEventNameByType } from './constants/eventTypeDefinitions';
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
}

interface BoardSummary {
    id: string;
    name: string;
    fileName: string;
    updatedAt: string;
}

function App() {
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

    useEffect(() => {
        initializeStartupFlow();
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

    const loadBoardState = async (id: string) => {
        try {
            const state = await window.electronAPI.getBoardState({ boardId: id });
            setBoardState(state);
        } catch (error) {
            console.error('Failed to load board state:', error);
        }
    };

    const handleCreateEvent = async (x: number, y: number) => {
        if (!boardId) return;

        try {
            await window.electronAPI.createEvent({
                boardId,
                name: getDefaultEventNameByType(selectedTool),
                type: selectedTool,
                x,
                y,
            });
            await loadBoardState(boardId);
        } catch (error) {
            console.error('Failed to create event:', error);
        }
    };

    const handleMoveEvent = async (eventId: string, x: number, y: number) => {
        if (!boardId) return;
        if (!boardState) return;

        const movingEvent = boardState.events.find((event) => event.id === eventId);
        if (!movingEvent) return;

        if (isOutOfBounds(x, y) || hasCardOverlap(boardState.events, eventId, x, y, movingEvent.name)) {
            await loadBoardState(boardId);
            return;
        }

        try {
            await window.electronAPI.moveEvent({
                boardId,
                eventId,
                newX: x,
                newY: y,
            });
            await loadBoardState(boardId);
        } catch (error) {
            console.error('Failed to move event:', error);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!boardId) return;

        try {
            await window.electronAPI.deleteEvent({
                boardId,
                eventId,
            });
            await loadBoardState(boardId);
        } catch (error) {
            console.error('Failed to delete event:', error);
        }
    };

    const handleRenameEvent = async (eventId: string, newName: string) => {
        if (!boardId) return;

        try {
            await window.electronAPI.renameEvent({
                boardId,
                eventId,
                newName,
            });
            await loadBoardState(boardId);
        } catch (error) {
            console.error('Failed to rename event:', error);
        }
    };

    const handleDetectAggregates = async () => {
        if (!boardId) return;

        try {
            await window.electronAPI.detectAggregates({ boardId });
            await loadBoardState(boardId);
        } catch (error) {
            console.error('Failed to detect aggregates:', error);
        }
    };

    const handleChangeStoragePath = async () => {
        setPendingStoragePath(storagePath);
        setSettingsError('');
        setIsSettingsModalOpen(true);
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
                storagePath={storagePath}
                onChangeStoragePath={handleChangeStoragePath}
            />
            <EventStormingCanvas
                boardState={boardState}
                onCreateEvent={handleCreateEvent}
                onMoveEvent={handleMoveEvent}
                onDeleteEvent={handleDeleteEvent}
                onRenameEvent={handleRenameEvent}
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

function hasCardOverlap(
    events: EventDTO[],
    movingEventId: string,
    nextX: number,
    nextY: number,
    movingEventName: string
): boolean {
    const movingDimensions = getEventCardDimensions(movingEventName);
    const movingBounds = {
        left: nextX,
        top: nextY,
        right: nextX + movingDimensions.width,
        bottom: nextY + movingDimensions.height,
    };

    return events.some((event) => {
        if (event.id === movingEventId) {
            return false;
        }

        const dimensions = getEventCardDimensions(event.name);
        const bounds = {
            left: event.position.x,
            top: event.position.y,
            right: event.position.x + dimensions.width,
            bottom: event.position.y + dimensions.height,
        };

        const isSeparated =
            movingBounds.right <= bounds.left ||
            movingBounds.left >= bounds.right ||
            movingBounds.bottom <= bounds.top ||
            movingBounds.top >= bounds.bottom;

        return !isSeparated;
    });
}
