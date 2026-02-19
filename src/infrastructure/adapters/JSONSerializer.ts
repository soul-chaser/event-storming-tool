import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';
import { Event } from '@domain/entities/Event';
import { EventName } from '@domain/value-objects/EventName';
import { EventType } from '@domain/value-objects/EventType';
import { Position } from '@domain/value-objects/Position';

/**
 * JSONSerializer
 *
 * EventStormingBoard를 JSON으로 직렬화/역직렬화합니다.
 */

interface BoardJSON {
    version: string;
    boardId: string;
    events: EventJSON[];
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
            board.addEvent(event);
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
}