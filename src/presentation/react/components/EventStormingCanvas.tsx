import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Arrow } from 'react-konva';
import { AggregateDTO, BoardState, CardConnection, EventDTO } from '../App';
import { EVENT_CARD_LAYOUT, getEventCardDimensions } from '@shared/utils/eventCardLayout';
import { buildCardConnectionRoute, CardRect } from '@shared/utils/cardConnectionRouting';

interface EventStormingCanvasProps {
    boardState: BoardState | null;
    onCreateEvent: (x: number, y: number) => void;
    onMoveEvents: (moves: Array<{ eventId: string; x: number; y: number }>) => void;
    onRenameEvent: (eventId: string, newName: string) => void;
    selectedEventIds: string[];
    onSelectionChange: (eventIds: string[]) => void;
    isArrowMode: boolean;
    onArrowTargetSelect: (targetId: string) => void;
    connections: CardConnection[];
    onCanvasReady?: (api: { toPNGDataURL: () => string | null }) => void;
}

const INLINE_INPUT_HEIGHT = 28;
const EDITOR_MIN_WIDTH = 120;
const EDITOR_PADDING_X = 6;

interface EditingState {
    eventId: string;
    value: string;
}

interface SelectionBox {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    additive: boolean;
}

interface DraggingState {
    anchorId: string;
    movingIds: string[];
    originById: Record<string, { x: number; y: number }>;
}

export const EventStormingCanvas: React.FC<EventStormingCanvasProps> = ({
    boardState,
    onCreateEvent,
    onMoveEvents,
    onRenameEvent,
    selectedEventIds,
    onSelectionChange,
    isArrowMode,
    onArrowTargetSelect,
    connections,
    onCanvasReady,
}) => {
    const stageRef = useRef(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const previousEventIdsRef = useRef<string[]>([]);
    const previousBoardIdRef = useRef<string | null>(null);
    const isComposingRef = useRef<boolean>(false);

    const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
    const [editingState, setEditingState] = useState<EditingState | null>(null);
    const [editorHeight, setEditorHeight] = useState<number>(INLINE_INPUT_HEIGHT);
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
    const [draggingState, setDraggingState] = useState<DraggingState | null>(null);
    const [dragPreviewById, setDragPreviewById] = useState<Record<string, { x: number; y: number }>>({});

    const selectedSet = useMemo(() => new Set(selectedEventIds), [selectedEventIds]);
    const editingEvent = editingState
        ? boardState?.events.find((event) => event.id === editingState.eventId) ?? null
        : null;

    const editingDimensions = getEventCardDimensions(editingState?.value ?? editingEvent?.name ?? '');

    const editingEditorDimensions = useMemo(() => {
        const value = editingState?.value ?? editingEvent?.name ?? '';
        const lines = value.split('\n');
        const maxLineUnits = Math.max(1, ...lines.map((line) => (
            Array.from(line).reduce((acc, char) => acc + (/[^\u0000-\u00ff]/.test(char) ? 2 : 1), 1)
        )));

        const editorInnerWidth = Math.max(
            EDITOR_MIN_WIDTH - (EDITOR_PADDING_X * 2),
            Math.ceil(maxLineUnits * EVENT_CARD_LAYOUT.FONT_SIZE * 0.52)
        );

        return {
            width: Math.ceil(editorInnerWidth + (EDITOR_PADDING_X * 2)),
        };
    }, [editingEvent?.name, editingState?.value]);

    const displayedEvents = useMemo(() => {
        if (!boardState) return [];
        return boardState.events.map((event) => {
            const preview = dragPreviewById[event.id];
            if (!preview) {
                return event;
            }
            return {
                ...event,
                position: { x: preview.x, y: preview.y },
            };
        });
    }, [boardState, dragPreviewById]);

    const cardBoundsById = useMemo(() => {
        const result: Record<string, CardRect> = {};
        for (const event of displayedEvents) {
            const dimensions = getEventCardDimensions(event.name);
            result[event.id] = {
                left: event.position.x,
                top: event.position.y,
                right: event.position.x + dimensions.width,
                bottom: event.position.y + dimensions.height,
            };
        }
        return result;
    }, [displayedEvents]);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const { width, height } = entry.contentRect;
            setStageSize({
                width: Math.max(0, Math.floor(width)),
                height: Math.max(0, Math.floor(height)),
            });
        });

        resizeObserver.observe(element);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!editingState) return;
        inputRef.current?.focus();
        inputRef.current?.select();
    }, [editingState?.eventId]);

    useEffect(() => {
        if (!editingState || !inputRef.current) return;

        const element = inputRef.current;
        element.style.height = 'auto';
        const nextHeight = Math.max(INLINE_INPUT_HEIGHT, element.scrollHeight);
        element.style.height = `${nextHeight}px`;
        setEditorHeight(nextHeight);
    }, [editingState?.eventId, editingState?.value, editingEditorDimensions.width]);

    useEffect(() => {
        const boardId = boardState?.id ?? null;
        const eventIds = boardState?.events.map((event) => event.id) ?? [];

        if (previousBoardIdRef.current !== boardId) {
            previousBoardIdRef.current = boardId;
            previousEventIdsRef.current = eventIds;
            return;
        }

        const previousEventIds = previousEventIdsRef.current;
        if (eventIds.length > previousEventIds.length) {
            const addedEvent = boardState?.events.find((event) => !previousEventIds.includes(event.id));
            if (addedEvent) {
                setEditorHeight(INLINE_INPUT_HEIGHT);
                setEditingState({
                    eventId: addedEvent.id,
                    value: addedEvent.name,
                });
                onSelectionChange([addedEvent.id]);
            }
        }

        previousEventIdsRef.current = eventIds;
    }, [boardState, onSelectionChange]);

    useEffect(() => {
        if (!onCanvasReady) return;

        onCanvasReady({
            toPNGDataURL: () => {
                const stage = stageRef.current as { toDataURL: (args: { pixelRatio: number }) => string } | null;
                if (!stage) return null;
                return stage.toDataURL({ pixelRatio: 2 });
            },
        });
    }, [onCanvasReady, stageSize.width, stageSize.height]);

    const commitInlineRename = () => {
        if (!editingState) return;
        if (isComposingRef.current) return;

        const originalName = boardState?.events.find((event) => event.id === editingState.eventId)?.name;
        const trimmedName = editingState.value.trim();
        setEditingState(null);

        if (!trimmedName || !originalName || trimmedName === originalName) return;
        onRenameEvent(editingState.eventId, trimmedName);
    };

    const cancelInlineRename = () => {
        setEditingState(null);
    };

    const handleStageMouseDown = (e: any) => {
        if (editingState) {
            commitInlineRename();
            return;
        }

        if (e.target !== e.target.getStage()) {
            return;
        }

        const pos = e.target.getStage().getPointerPosition();
        if (!pos) return;

        setSelectionBox({
            startX: pos.x,
            startY: pos.y,
            endX: pos.x,
            endY: pos.y,
            additive: Boolean(e.evt.shiftKey),
        });
    };

    const handleStageMouseMove = (e: any) => {
        if (!selectionBox) return;
        const pos = e.target.getStage().getPointerPosition();
        if (!pos) return;

        setSelectionBox((prev) => (prev ? {
            ...prev,
            endX: pos.x,
            endY: pos.y,
        } : prev));
    };

    const handleStageMouseUp = () => {
        if (!selectionBox) return;

        const width = Math.abs(selectionBox.endX - selectionBox.startX);
        const height = Math.abs(selectionBox.endY - selectionBox.startY);

        if (width < 4 && height < 4) {
            if (!selectionBox.additive && !isArrowMode) {
                onSelectionChange([]);
                onCreateEvent(selectionBox.startX, selectionBox.startY);
            }
            setSelectionBox(null);
            return;
        }

        const normalized = normalizeRect(selectionBox.startX, selectionBox.startY, selectionBox.endX, selectionBox.endY);
        const hits = displayedEvents
            .filter((event) => intersectsRect(normalized, cardBoundsById[event.id]))
            .map((event) => event.id);

        if (selectionBox.additive) {
            const merged = new Set([...selectedEventIds, ...hits]);
            onSelectionChange(Array.from(merged));
        } else {
            onSelectionChange(hits);
        }

        setSelectionBox(null);
    };

    const handleEventRenameStart = (event: EventDTO) => {
        setEditorHeight(INLINE_INPUT_HEIGHT);
        setEditingState({
            eventId: event.id,
            value: event.name,
        });
    };

    const handleCardSelect = (eventId: string, e: any) => {
        if (isArrowMode) {
            onArrowTargetSelect(eventId);
            return;
        }

        const shiftKey = Boolean(e?.evt?.shiftKey);
        if (shiftKey) {
            if (selectedSet.has(eventId)) {
                onSelectionChange(selectedEventIds.filter((id) => id !== eventId));
            } else {
                onSelectionChange([...selectedEventIds, eventId]);
            }
            return;
        }

        if (!selectedSet.has(eventId)) {
            onSelectionChange([eventId]);
        }
    };

    const handleDragStart = (eventId: string) => {
        const baseIds = selectedSet.has(eventId) && selectedEventIds.length > 0
            ? selectedEventIds
            : [eventId];

        if (!selectedSet.has(eventId)) {
            onSelectionChange([eventId]);
        }

        const originById: Record<string, { x: number; y: number }> = {};
        for (const event of boardState?.events ?? []) {
            if (baseIds.includes(event.id)) {
                originById[event.id] = { x: event.position.x, y: event.position.y };
            }
        }

        setDraggingState({
            anchorId: eventId,
            movingIds: baseIds,
            originById,
        });
    };

    const handleDragMove = (e: any) => {
        if (!draggingState) return;

        const anchorOrigin = draggingState.originById[draggingState.anchorId];
        if (!anchorOrigin) return;

        const deltaX = e.target.x() - anchorOrigin.x;
        const deltaY = e.target.y() - anchorOrigin.y;

        const preview: Record<string, { x: number; y: number }> = {};
        for (const movingId of draggingState.movingIds) {
            const origin = draggingState.originById[movingId];
            if (!origin) continue;
            preview[movingId] = {
                x: origin.x + deltaX,
                y: origin.y + deltaY,
            };
        }
        setDragPreviewById(preview);
    };

    const handleDragEnd = (e: any) => {
        if (!draggingState) return;

        const anchorOrigin = draggingState.originById[draggingState.anchorId];
        if (!anchorOrigin) {
            setDraggingState(null);
            setDragPreviewById({});
            return;
        }

        const deltaX = e.target.x() - anchorOrigin.x;
        const deltaY = e.target.y() - anchorOrigin.y;

        const moves = draggingState.movingIds
            .map((eventId) => {
                const origin = draggingState.originById[eventId];
                if (!origin) return null;
                return {
                    eventId,
                    x: origin.x + deltaX,
                    y: origin.y + deltaY,
                };
            })
            .filter((move): move is { eventId: string; x: number; y: number } => move !== null);

        setDraggingState(null);
        setDragPreviewById({});
        onMoveEvents(moves);
    };

    const selectionRect = selectionBox
        ? normalizeRect(selectionBox.startX, selectionBox.startY, selectionBox.endX, selectionBox.endY)
        : null;

    return (
        <div className="canvas-container" ref={containerRef}>
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                ref={stageRef}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
            >
                <Layer>
                    {boardState?.aggregates.map((aggregate) => (
                        <AggregateBox key={aggregate.id} aggregate={aggregate} />
                    ))}

                    {connections.map((connection) => {
                        const sourceBounds = cardBoundsById[connection.sourceId];
                        const targetBounds = cardBoundsById[connection.targetId];
                        if (!sourceBounds || !targetBounds) {
                            return null;
                        }

                        const route = buildCardConnectionRoute(
                            sourceBounds,
                            targetBounds,
                            Object.values(cardBoundsById)
                        );

                        return (
                            <Arrow
                                key={`${connection.sourceId}->${connection.targetId}`}
                                points={route}
                                stroke="#0f172a"
                                fill="#0f172a"
                                strokeWidth={2}
                                pointerLength={8}
                                pointerWidth={8}
                                lineJoin="round"
                            />
                        );
                    })}

                    {displayedEvents.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            dimensions={getEventCardDimensions(event.name)}
                            isEditing={editingState?.eventId === event.id}
                            isSelected={selectedSet.has(event.id)}
                            onDragStart={() => handleDragStart(event.id)}
                            onDragMove={handleDragMove}
                            onDragEnd={handleDragEnd}
                            onSelect={(e) => handleCardSelect(event.id, e)}
                            onDoubleClick={() => handleEventRenameStart(event)}
                        />
                    ))}

                    {selectionRect && (
                        <Rect
                            x={selectionRect.left}
                            y={selectionRect.top}
                            width={selectionRect.right - selectionRect.left}
                            height={selectionRect.bottom - selectionRect.top}
                            fill="rgba(59, 130, 246, 0.15)"
                            stroke="#2563eb"
                            strokeWidth={1.5}
                            dash={[6, 4]}
                        />
                    )}
                </Layer>
            </Stage>
            {editingState && (
                <textarea
                    ref={inputRef}
                    className="event-inline-editor"
                    style={{
                        left: (editingEvent?.position.x ?? 0) + 8,
                        top: (editingEvent?.position.y ?? 0) + Math.floor((editingDimensions.height - editorHeight) / 2),
                        width: editingEditorDimensions.width,
                        height: editorHeight,
                    }}
                    value={editingState.value}
                    onChange={(e) => {
                        const nextValue = e.currentTarget.value;
                        setEditingState((prev) => (prev ? { ...prev, value: nextValue } : prev));
                    }}
                    onBlur={commitInlineRename}
                    onCompositionStart={() => {
                        isComposingRef.current = true;
                    }}
                    onCompositionEnd={(e) => {
                        isComposingRef.current = false;
                        const nextValue = e.currentTarget.value;
                        setEditingState((prev) => (prev ? { ...prev, value: nextValue } : prev));
                    }}
                    onKeyDown={(e) => {
                        const nativeEvent = e.nativeEvent as { isComposing?: boolean } | undefined;
                        if (isComposingRef.current || nativeEvent?.isComposing === true) {
                            return;
                        }

                        if (e.key === 'Enter') {
                            if (e.shiftKey) return;
                            e.preventDefault();
                            commitInlineRename();
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelInlineRename();
                        }
                    }}
                />
            )}
        </div>
    );
};

interface EventCardProps {
    event: EventDTO;
    dimensions: { width: number; height: number };
    isEditing: boolean;
    isSelected: boolean;
    onDragStart: () => void;
    onDragMove: (e: any) => void;
    onDragEnd: (e: any) => void;
    onSelect: (e: any) => void;
    onDoubleClick: () => void;
}

const EventCard: React.FC<EventCardProps> = ({
    event,
    dimensions,
    isEditing,
    isSelected,
    onDragStart,
    onDragMove,
    onDragEnd,
    onSelect,
    onDoubleClick,
}) => {
    return (
        <Group
            x={event.position.x}
            y={event.position.y}
            draggable={!isEditing}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onTap={onSelect}
            onMouseDown={onSelect}
            onDblClick={onDoubleClick}
        >
            <Rect
                width={dimensions.width}
                height={dimensions.height}
                fill={event.color}
                stroke={isSelected ? '#111827' : '#333'}
                strokeWidth={isSelected ? 4 : 2}
                cornerRadius={5}
                shadowBlur={5}
                shadowOpacity={0.3}
            />
            <Text
                text={event.name}
                width={dimensions.width}
                height={dimensions.height}
                align="center"
                verticalAlign="middle"
                fontSize={EVENT_CARD_LAYOUT.FONT_SIZE}
                lineHeight={EVENT_CARD_LAYOUT.LINE_HEIGHT}
                fontFamily="Arial"
                fill="#000"
                padding={EVENT_CARD_LAYOUT.PADDING}
                wrap="char"
            />
        </Group>
    );
};

interface AggregateBoxProps {
    aggregate: AggregateDTO;
}

const AggregateBox: React.FC<AggregateBoxProps> = ({ aggregate }) => {
    if (!aggregate.bounds) return null;

    const { minX, minY, maxX, maxY } = aggregate.bounds;
    const width = maxX - minX;
    const height = maxY - minY;

    return (
        <Group>
            <Rect
                x={minX}
                y={minY}
                width={width}
                height={height}
                fill="rgba(255, 215, 0, 0.1)"
                stroke="#FFD700"
                strokeWidth={2}
                dash={[10, 5]}
                cornerRadius={10}
            />
            <Text
                x={minX + 10}
                y={minY + 10}
                text={aggregate.name}
                fontSize={16}
                fontStyle="bold"
                fill="#D4AF37"
            />
        </Group>
    );
};

function normalizeRect(startX: number, startY: number, endX: number, endY: number): CardRect {
    return {
        left: Math.min(startX, endX),
        right: Math.max(startX, endX),
        top: Math.min(startY, endY),
        bottom: Math.max(startY, endY),
    };
}

function intersectsRect(a: CardRect, b?: CardRect): boolean {
    if (!b) return false;

    const separated =
        a.right < b.left ||
        a.left > b.right ||
        a.bottom < b.top ||
        a.top > b.bottom;

    return !separated;
}
