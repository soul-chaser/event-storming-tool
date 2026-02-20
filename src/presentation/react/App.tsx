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

function App() {
    const [boardId, setBoardId] = useState<string>('');
    const [boardState, setBoardState] = useState<BoardState | null>(null);
    const [selectedTool, setSelectedTool] = useState<string>('domain-event');

    useEffect(() => {
        // 초기 보드 생성
        initializeBoard();
    }, []);

    const initializeBoard = async () => {
        try {
            const newBoardId = await window.electronAPI.createBoard();
            setBoardId(newBoardId);
            await loadBoardState(newBoardId);
        } catch (error) {
            console.error('Failed to initialize board:', error);
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

    return (
        <div className="app">
            <Toolbar
                selectedTool={selectedTool}
                onToolChange={setSelectedTool}
                onDetectAggregates={handleDetectAggregates}
            />
            <EventStormingCanvas
                boardState={boardState}
                onCreateEvent={handleCreateEvent}
                onMoveEvent={handleMoveEvent}
                onDeleteEvent={handleDeleteEvent}
                onRenameEvent={handleRenameEvent}
            />
        </div>
    );
}

export default App;

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
