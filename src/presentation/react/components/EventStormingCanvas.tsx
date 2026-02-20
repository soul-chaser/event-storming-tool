import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import { EventDTO, AggregateDTO, BoardState } from '../App';
import { EVENT_CARD_LAYOUT, getEventCardDimensions } from '@shared/utils/eventCardLayout';

interface EventStormingCanvasProps {
    boardState: BoardState | null;
    onCreateEvent: (x: number, y: number) => void;
    onMoveEvent: (eventId: string, x: number, y: number) => void;
    onDeleteEvent: (eventId: string) => void;
    onRenameEvent: (eventId: string, newName: string) => void;
    selectedEventId?: string | null;
    onSelectEvent?: (eventId: string | null) => void;
    onCanvasReady?: (api: { toPNGDataURL: () => string | null }) => void;
}

const INLINE_INPUT_HEIGHT = 28;
const EDITOR_MIN_WIDTH = 120;
const EDITOR_PADDING_X = 6;
const EDITOR_PADDING_Y = 4;

interface EditingState {
    eventId: string;
    value: string;
}

export const EventStormingCanvas: React.FC<EventStormingCanvasProps> = ({
                                                                            boardState,
                                                                            onCreateEvent,
                                                                            onMoveEvent,
                                                                            onDeleteEvent,
                                                                            onRenameEvent,
                                                                            selectedEventId,
                                                                            onSelectEvent,
                                                                            onCanvasReady,
                                                                        }) => {
    const stageRef = useRef(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const isComposingRef = useRef<boolean>(false);
    const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
    const [editingState, setEditingState] = useState<EditingState | null>(null);
    const [editorHeight, setEditorHeight] = useState<number>(INLINE_INPUT_HEIGHT);
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
        if (!editingState) {
            return;
        }

        inputRef.current?.focus();
        inputRef.current?.select();
    }, [editingState?.eventId]);

    useEffect(() => {
        if (!editingState || !inputRef.current) {
            return;
        }

        const element = inputRef.current;
        element.style.height = 'auto';
        const nextHeight = Math.max(INLINE_INPUT_HEIGHT, element.scrollHeight);
        element.style.height = `${nextHeight}px`;
        setEditorHeight(nextHeight);
    }, [editingState?.eventId, editingState?.value, editingEditorDimensions.width]);

    useEffect(() => {
        if (!onCanvasReady) {
            return;
        }

        onCanvasReady({
            toPNGDataURL: () => {
                const stage = stageRef.current as { toDataURL: (args: { pixelRatio: number }) => string } | null;
                if (!stage) {
                    return null;
                }

                return stage.toDataURL({ pixelRatio: 2 });
            },
        });
    }, [onCanvasReady, stageSize.width, stageSize.height]);

    const handleStageClick = (e: any) => {
        if (editingState) {
            commitInlineRename();
            return;
        }

        // 빈 공간 클릭 시 이벤트 생성
        if (e.target === e.target.getStage()) {
            onSelectEvent?.(null);
            const pos = e.target.getStage().getPointerPosition();
            onCreateEvent(pos.x, pos.y);
        }
    };

    const handleEventDragEnd = (eventId: string, e: any) => {
        const node = e.target;
        onMoveEvent(eventId, node.x(), node.y());
    };

    const handleEventRenameStart = (event: EventDTO) => {
        setEditorHeight(INLINE_INPUT_HEIGHT);
        setEditingState({
            eventId: event.id,
            value: event.name,
        });
    };

    const commitInlineRename = () => {
        if (!editingState) {
            return;
        }

        if (isComposingRef.current) {
            return;
        }

        const originalName = boardState?.events.find((event) => event.id === editingState.eventId)?.name;
        const trimmedName = editingState.value.trim();
        setEditingState(null);

        if (!trimmedName || !originalName || trimmedName === originalName) {
            return;
        }

        onRenameEvent(editingState.eventId, trimmedName);
    };

    const cancelInlineRename = () => {
        setEditingState(null);
    };

    const handleEventDelete = (eventId: string) => {
        if (editingState?.eventId === eventId) {
            cancelInlineRename();
        }

        if (window.confirm('Delete this event?')) {
            onDeleteEvent(eventId);
        }
    };

    return (
        <div className="canvas-container" ref={containerRef}>
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                ref={stageRef}
                onClick={handleStageClick}
            >
                <Layer>
                    {/* Aggregate 배경 */}
                    {boardState?.aggregates.map((aggregate) => (
                        <AggregateBox key={aggregate.id} aggregate={aggregate} />
                    ))}

                    {/* Event 카드 */}
                    {boardState?.events.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            dimensions={getEventCardDimensions(event.name)}
                            isEditing={editingState?.eventId === event.id}
                            isSelected={selectedEventId === event.id}
                            onDragEnd={(e) => handleEventDragEnd(event.id, e)}
                            onClick={() => onSelectEvent?.(event.id)}
                            onDoubleClick={() => handleEventRenameStart(event)}
                            onContextMenu={() => handleEventDelete(event.id)}
                        />
                    ))}
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
                        setEditingState((prev) => (
                            prev
                                ? { ...prev, value: nextValue }
                                : prev
                        ));
                    }}
                    onBlur={commitInlineRename}
                    onCompositionStart={() => {
                        isComposingRef.current = true;
                    }}
                    onCompositionEnd={(e) => {
                        isComposingRef.current = false;
                        const nextValue = e.currentTarget.value;
                        setEditingState((prev) => (
                            prev
                                ? { ...prev, value: nextValue }
                                : prev
                        ));
                    }}
                    onKeyDown={(e) => {
                        const nativeEvent = e.nativeEvent as { isComposing?: boolean } | undefined;
                        if (isComposingRef.current || nativeEvent?.isComposing === true) {
                            return;
                        }

                        if (e.key === 'Enter') {
                            if (e.shiftKey) {
                                return;
                            }
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
    onDragEnd: (e: any) => void;
    onClick: () => void;
    onDoubleClick: () => void;
    onContextMenu: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, dimensions, isEditing, isSelected, onDragEnd, onClick, onDoubleClick, onContextMenu }) => {
    return (
        <Group
            x={event.position.x}
            y={event.position.y}
            draggable={!isEditing}
            onDragEnd={onDragEnd}
            onClick={onClick}
            onDblClick={onDoubleClick}
            onContextMenu={(e) => {
                e.evt.preventDefault();
                onContextMenu();
            }}
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
