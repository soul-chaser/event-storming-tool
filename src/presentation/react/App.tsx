import React, { useState, useEffect } from 'react';
import { EventStormingCanvas } from './components/EventStormingCanvas';
import { Toolbar } from './components/Toolbar';
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
                name: 'New Event',
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
            />
        </div>
    );
}

export default App;