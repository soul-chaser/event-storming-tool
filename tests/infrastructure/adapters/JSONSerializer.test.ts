import { describe, it, expect, beforeEach } from 'vitest';
import { JSONSerializer } from '@infrastructure/adapters/JSONSerializer';
import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';
import { Event } from '@domain/entities/Event';
import { EventName } from '@domain/value-objects/EventName';
import { EventType } from '@domain/value-objects/EventType';
import { Position } from '@domain/value-objects/Position';

describe('JSONSerializer', () => {
    let serializer: JSONSerializer;

    beforeEach(() => {
        serializer = new JSONSerializer();
    });

    describe('serialize', () => {
        it('빈 보드를 직렬화할 수 있다', () => {
            const board = EventStormingBoard.create(BoardId.generate());

            const json = serializer.serialize(board);

            expect(json).toContain('"events": []');
        });

        it('이벤트가 있는 보드를 직렬화할 수 있다', () => {
            const board = EventStormingBoard.create(BoardId.generate());
            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            board.addEvent(event);

            const json = serializer.serialize(board);

            expect(json).toContain('사용자 등록됨');
            expect(json).toContain('domain-event');
        });

        it('직렬화된 JSON은 유효한 형식이다', () => {
            const board = EventStormingBoard.create(BoardId.generate());
            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            board.addEvent(event);

            const json = serializer.serialize(board);

            expect(() => JSON.parse(json)).not.toThrow();
        });

        it('직렬화된 JSON에 버전 정보가 포함된다', () => {
            const board = EventStormingBoard.create(BoardId.generate());

            const json = serializer.serialize(board);
            const parsed = JSON.parse(json);

            expect(parsed.version).toBe('1.0');
        });
    });

    describe('deserialize', () => {
        it('직렬화된 보드를 역직렬화할 수 있다', () => {
            const board = EventStormingBoard.create(BoardId.generate());
            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            board.addEvent(event);

            const json = serializer.serialize(board);
            const restored = serializer.deserialize(json);

            expect(restored.getEventCount()).toBe(1);
            expect(restored.getAllEvents()[0].name.value).toBe('사용자 등록됨');
        });

        it('유효하지 않은 JSON은 에러를 발생시킨다', () => {
            const invalidJson = 'invalid json';

            expect(() => serializer.deserialize(invalidJson)).toThrow();
        });

        it('버전이 없는 JSON은 에러를 발생시킨다', () => {
            const json = '{"events":[]}';

            expect(() => serializer.deserialize(json)).toThrow();
        });

        it('지원하지 않는 버전은 에러를 발생시킨다', () => {
            const json = '{"version":"2.0","events":[]}';

            expect(() => serializer.deserialize(json)).toThrow();
        });

        it('겹치는 이벤트가 있어도 로드 시 자동 재배치한다', () => {
            const boardId = BoardId.generate().value;
            const json = JSON.stringify({
                version: '1.0',
                boardId,
                events: [
                    {
                        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                        name: '이벤트1',
                        type: 'domain-event',
                        position: { x: 100, y: 200 },
                        createdAt: new Date().toISOString(),
                        lastModified: new Date().toISOString(),
                    },
                    {
                        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
                        name: '이벤트2',
                        type: 'domain-event',
                        position: { x: 100, y: 200 },
                        createdAt: new Date().toISOString(),
                        lastModified: new Date().toISOString(),
                    },
                ],
            });

            const restored = serializer.deserialize(json);
            expect(restored.getEventCount()).toBe(2);

            const events = restored.getAllEvents();
            expect(events[0].position.equals(events[1].position)).toBe(false);
        });
    });

    describe('round-trip', () => {
        it('직렬화 후 역직렬화하면 동일한 데이터를 얻는다', () => {
            const board = EventStormingBoard.create(BoardId.generate());

            const event1 = Event.create({
                name: new EventName('사용자 등록'),
                type: new EventType('command'),
                position: new Position(100, 200),
                description: '신규 사용자',
            });
            const event2 = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(260, 200),
            });

            board.addEvent(event1);
            board.addEvent(event2);

            const json = serializer.serialize(board);
            const restored = serializer.deserialize(json);

            expect(restored.getEventCount()).toBe(2);
            const events = restored.getAllEvents();
            expect(events[0].name.value).toBe('사용자 등록');
            expect(events[0].description).toBe('신규 사용자');
            expect(events[1].name.value).toBe('사용자 등록됨');
        });
    });
});
