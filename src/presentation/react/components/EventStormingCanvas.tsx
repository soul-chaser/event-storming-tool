import React, { useRef } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import { EventDTO, AggregateDTO, BoardState } from '../App';

interface EventStormingCanvasProps {
    boardState: BoardState | null;
    onCreateEvent: (x: number, y: number) => void;
    onMoveEvent: (eventId: string, x: number, y: number) => void;
    onDeleteEvent: (eventId: string) => void;
}

const EVENT_CARD_WIDTH = 120;
const EVENT_CARD_HEIGHT = 80;

export const EventStormingCanvas: React.FC<EventStormingCanvasProps> = ({
                                                                            boardState,
                                                                            onCreateEvent,
                                                                            onMoveEvent,
                                                                            onDeleteEvent,
                                                                        }) => {
    const stageRef = useRef(null);

    const handleStageClick = (e: any) => {
        // 빈 공간 클릭 시 이벤트 생성
        if (e.target === e.target.getStage()) {
            const pos = e.target.getStage().getPointerPosition();
            onCreateEvent(pos.x, pos.y);
        }
    };

    const handleEventDragEnd = (eventId: string, e: any) => {
        const node = e.target;
        onMoveEvent(eventId, node.x(), node.y());
    };

    const handleEventDoubleClick = (eventId: string) => {
        if (window.confirm('Delete this event?')) {
            onDeleteEvent(eventId);
        }
    };

    return (
        <div className="canvas-container">
            <Stage
                width={window.innerWidth}
                height={window.innerHeight - 60}
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
                            onDragEnd={(e) => handleEventDragEnd(event.id, e)}
                            onDoubleClick={() => handleEventDoubleClick(event.id)}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
};

interface EventCardProps {
    event: EventDTO;
    onDragEnd: (e: any) => void;
    onDoubleClick: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onDragEnd, onDoubleClick }) => {
    return (
        <Group
            x={event.position.x}
            y={event.position.y}
            draggable
            onDragEnd={onDragEnd}
            onDblClick={onDoubleClick}
        >
            <Rect
                width={EVENT_CARD_WIDTH}
                height={EVENT_CARD_HEIGHT}
                fill={event.color}
                stroke="#333"
                strokeWidth={2}
                cornerRadius={5}
                shadowBlur={5}
                shadowOpacity={0.3}
            />
            <Text
                text={event.name}
                width={EVENT_CARD_WIDTH}
                height={EVENT_CARD_HEIGHT}
                align="center"
                verticalAlign="middle"
                fontSize={14}
                fontFamily="Arial"
                fill="#000"
                padding={10}
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