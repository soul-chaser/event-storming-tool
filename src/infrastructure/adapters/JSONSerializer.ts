import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';
import { Event } from '@domain/entities/Event';
import { EventName } from '@domain/value-objects/EventName';
import { EventType } from '@domain/value-objects/EventType';
import { Position, BOARD_CONSTANTS } from '@domain/value-objects/Position';

/**
 * JSONSerializer
 *
 * EventStormingBoard를 JSON으로 직렬화/역직렬화합니다.
 */

interface BoardJSON {
    version: string;
    boardId: string;
    events: EventJSON[];
    connections?: CardConnectionJSON[];
}

interface EventJSON {
    id: string;
    name: string;
    type: string;
    position: { x: number; y: number };
    description?: string;
    createdAt: string;
    lastModified: string;
}

interface CardConnectionJSON {
    sourceId: string;
    targetId: string;
}

const SUPPORTED_VERSION = '1.0';

export class JSONSerializer {
    /**
     * EventStormingBoard를 JSON 문자열로 직렬화합니다.
     *
     * @param board - 직렬화할 보드
     * @returns JSON 문자열
     */
    serialize(board: EventStormingBoard): string {
        const boardJSON: BoardJSON = {
            version: SUPPORTED_VERSION,
            boardId: board.id.value,
            events: board.getAllEvents().map(e => this.serializeEvent(e)),
            connections: board.getAllConnections().map((connection) => ({
                sourceId: connection.sourceId,
                targetId: connection.targetId,
            })),
        };

        return JSON.stringify(boardJSON, null, 2);
    }

    /**
     * JSON 문자열을 EventStormingBoard로 역직렬화합니다.
     *
     * @param json - JSON 문자열
     * @returns EventStormingBoard 인스턴스
     */
    deserialize(json: string): EventStormingBoard {
        let data: BoardJSON;

        try {
            data = JSON.parse(json);
        } catch (e) {
            throw new Error('Invalid JSON format');
        }

        // 버전 검증
        if (!data.version) {
            throw new Error('Missing version information');
        }

        if (data.version !== SUPPORTED_VERSION) {
            throw new Error(`Unsupported version: ${data.version}`);
        }

        // 보드 생성
        const boardId = new BoardId(data.boardId);
        const board = EventStormingBoard.create(boardId);

        // 이벤트 복원
        for (const eventJSON of data.events) {
            const event = this.deserializeEvent(eventJSON);
            const availablePosition = this.findAvailablePosition(board, event.position, event.name.value);

            if (!event.position.equals(availablePosition)) {
                event.moveTo(availablePosition);
            }

            board.addEvent(event);
        }

        for (const connection of data.connections ?? []) {
            const source = board.getAllEvents().find((event) => event.id.value === connection.sourceId);
            const target = board.getAllEvents().find((event) => event.id.value === connection.targetId);
            if (!source || !target) {
                continue;
            }
            board.addConnection(source.id, target.id);
        }

        return board;
    }

    /**
     * Event를 JSON으로 직렬화합니다.
     */
    private serializeEvent(event: Event): EventJSON {
        return {
            id: event.id.value,
            name: event.name.value,
            type: event.type.value,
            position: {
                x: event.position.x,
                y: event.position.y,
            },
            description: event.description,
            createdAt: event.createdAt.toISOString(),
            lastModified: event.lastModified.toISOString(),
        };
    }

    /**
     * JSON을 Event로 역직렬화합니다.
     */
    private deserializeEvent(json: EventJSON): Event {
        return Event.fromJSON({
            id: json.id,
            name: json.name,
            type: json.type,
            position: json.position,
            description: json.description,
            createdAt: json.createdAt,
            lastModified: json.lastModified,
        });
    }

    private findAvailablePosition(
        board: EventStormingBoard,
        requestedPosition: Position,
        eventName: string
    ): Position {
        if (!board.hasOverlappingEvent(requestedPosition, undefined, eventName)) {
            return requestedPosition;
        }

        const step = 60;
        const maxRing = 60;

        for (let ring = 1; ring <= maxRing; ring++) {
            const distance = ring * step;
            const candidates: Array<{ x: number; y: number }> = [];

            for (let dx = -ring; dx <= ring; dx++) {
                candidates.push({
                    x: requestedPosition.x + (dx * step),
                    y: requestedPosition.y - distance,
                });
                candidates.push({
                    x: requestedPosition.x + (dx * step),
                    y: requestedPosition.y + distance,
                });
            }

            for (let dy = -(ring - 1); dy <= ring - 1; dy++) {
                candidates.push({
                    x: requestedPosition.x - distance,
                    y: requestedPosition.y + (dy * step),
                });
                candidates.push({
                    x: requestedPosition.x + distance,
                    y: requestedPosition.y + (dy * step),
                });
            }

            for (const candidate of candidates) {
                if (!this.isWithinBoard(candidate.x, candidate.y)) {
                    continue;
                }

                const position = new Position(candidate.x, candidate.y);
                if (!board.hasOverlappingEvent(position, undefined, eventName)) {
                    return position;
                }
            }
        }

        return requestedPosition;
    }

    private isWithinBoard(x: number, y: number): boolean {
        return (
            x >= 0 &&
            y >= 0 &&
            x <= BOARD_CONSTANTS.MAX_WIDTH &&
            y <= BOARD_CONSTANTS.MAX_HEIGHT
        );
    }
}
