import { describe, it, expect, beforeEach } from 'vitest';
import { Event } from '@domain/entities/Event';
import { EventId } from '@domain/value-objects/EventId';
import { EventName } from '@domain/value-objects/EventName';
import { EventType } from '@domain/value-objects/EventType';
import { Position } from '@domain/value-objects/Position';
import { DomainError } from '@shared/errors/DomainError';

describe('Event (Entity)', () => {
    describe('생성', () => {
        it('유효한 속성으로 Event를 생성할 수 있다', () => {
            // Arrange
            const id = EventId.generate();
            const name = new EventName('사용자 등록됨');
            const type = new EventType('domain-event');
            const position = new Position(100, 200);

            // Act
            const event = new Event({ id, name, type, position });

            // Assert
            expect(event.id).toBe(id);
            expect(event.name).toBe(name);
            expect(event.type).toBe(type);
            expect(event.position).toBe(position);
        });

        it('생성 시 타임스탬프가 자동으로 설정된다', () => {
            const before = new Date();

            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });

            const after = new Date();

            expect(event.createdAt).toBeInstanceOf(Date);
            expect(event.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(event.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
        });

        it('선택적 description을 포함할 수 있다', () => {
            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
                description: '신규 사용자가 회원가입을 완료함',
            });

            expect(event.description).toBe('신규 사용자가 회원가입을 완료함');
        });

        it('description 없이 생성하면 undefined이다', () => {
            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });

            expect(event.description).toBeUndefined();
        });
    });

    describe('moveTo', () => {
        let event: Event;

        beforeEach(() => {
            event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
        });

        it('유효한 위치로 이동할 수 있다', () => {
            const newPosition = new Position(300, 400);

            event.moveTo(newPosition);

            expect(event.position.equals(newPosition)).toBe(true);
        });

        it('보드 경계를 벗어나는 위치로는 이동할 수 없다', () => {
            const outOfBoundsPosition = new Position(10001, 200);

            expect(() => event.moveTo(outOfBoundsPosition)).toThrow(DomainError);
            expect(() => event.moveTo(outOfBoundsPosition)).toThrow('Position out of bounds');
        });

        it('같은 위치로 이동할 수 있다', () => {
            const samePosition = new Position(100, 200);

            event.moveTo(samePosition);

            expect(event.position.equals(samePosition)).toBe(true);
        });

        it('이동 시 lastModified가 갱신된다', async () => {
            const originalModified = event.lastModified;

            // 시간이 흐름을 보장하기 위한 작은 딜레이
            await new Promise(resolve => setTimeout(resolve, 10));

            event.moveTo(new Position(300, 400));

            expect(event.lastModified.getTime()).toBeGreaterThan(originalModified.getTime());
        });

        it('이동해도 createdAt은 변경되지 않는다', async () => {
            const originalCreatedAt = event.createdAt;

            await new Promise(resolve => setTimeout(resolve, 10));

            event.moveTo(new Position(300, 400));

            expect(event.createdAt).toBe(originalCreatedAt);
        });
    });

    describe('changeName', () => {
        let event: Event;

        beforeEach(() => {
            event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
        });

        it('이름을 변경할 수 있다', () => {
            const newName = new EventName('회원 등록 완료됨');

            event.changeName(newName);

            expect(event.name.equals(newName)).toBe(true);
        });

        it('이름 변경 시 lastModified가 갱신된다', async () => {
            const originalModified = event.lastModified;

            await new Promise(resolve => setTimeout(resolve, 10));

            event.changeName(new EventName('회원 등록 완료됨'));

            expect(event.lastModified.getTime()).toBeGreaterThan(originalModified.getTime());
        });
    });

    describe('changeType', () => {
        let event: Event;

        beforeEach(() => {
            event = Event.create({
                name: new EventName('사용자 등록'),
                type: new EventType('command'),
                position: new Position(100, 200),
            });
        });

        it('타입을 변경할 수 있다', () => {
            const newType = new EventType('domain-event');

            event.changeType(newType);

            expect(event.type.equals(newType)).toBe(true);
        });

        it('타입 변경 시 lastModified가 갱신된다', async () => {
            const originalModified = event.lastModified;

            await new Promise(resolve => setTimeout(resolve, 10));

            event.changeType(new EventType('domain-event'));

            expect(event.lastModified.getTime()).toBeGreaterThan(originalModified.getTime());
        });
    });

    describe('updateDescription', () => {
        let event: Event;

        beforeEach(() => {
            event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
        });

        it('설명을 추가할 수 있다', () => {
            event.updateDescription('신규 사용자 회원가입');

            expect(event.description).toBe('신규 사용자 회원가입');
        });

        it('설명을 변경할 수 있다', () => {
            event.updateDescription('초기 설명');
            event.updateDescription('변경된 설명');

            expect(event.description).toBe('변경된 설명');
        });

        it('설명을 제거할 수 있다', () => {
            event.updateDescription('설명');
            event.updateDescription(undefined);

            expect(event.description).toBeUndefined();
        });

        it('설명 변경 시 lastModified가 갱신된다', async () => {
            const originalModified = event.lastModified;

            await new Promise(resolve => setTimeout(resolve, 10));

            event.updateDescription('새 설명');

            expect(event.lastModified.getTime()).toBeGreaterThan(originalModified.getTime());
        });
    });

    describe('Entity 동일성', () => {
        it('같은 ID를 가진 Event는 동일하다', () => {
            const id = EventId.generate();
            const event1 = new Event({
                id,
                name: new EventName('이벤트1'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            const event2 = new Event({
                id,
                name: new EventName('이벤트2'),
                type: new EventType('command'),
                position: new Position(300, 400),
            });

            expect(event1.equals(event2)).toBe(true);
        });

        it('다른 ID를 가진 Event는 동일하지 않다', () => {
            const event1 = Event.create({
                name: new EventName('이벤트1'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            const event2 = Event.create({
                name: new EventName('이벤트1'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });

            expect(event1.equals(event2)).toBe(false);
        });

        it('자기 자신과는 항상 동일하다', () => {
            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });

            expect(event.equals(event)).toBe(true);
        });
    });

    describe('getColor', () => {
        it('EventType에 따른 색상을 반환한다', () => {
            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });

            expect(event.getColor()).toBe('#FFA500');
        });

        it('Command 타입은 하늘색을 반환한다', () => {
            const event = Event.create({
                name: new EventName('사용자 등록'),
                type: new EventType('command'),
                position: new Position(100, 200),
            });

            expect(event.getColor()).toBe('#87CEEB');
        });
    });

    describe('toJSON', () => {
        it('JSON 직렬화가 가능하다', () => {
            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
                description: '신규 사용자 등록',
            });

            const json = event.toJSON();

            expect(json).toMatchObject({
                id: event.id.value,
                name: '사용자 등록됨',
                type: 'domain-event',
                position: { x: 100, y: 200 },
                description: '신규 사용자 등록',
            });
            expect(json.createdAt).toBeDefined();
            expect(json.lastModified).toBeDefined();
        });

        it('description이 없으면 JSON에도 포함되지 않는다', () => {
            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });

            const json = event.toJSON();

            expect(json.description).toBeUndefined();
        });
    });

    describe('fromJSON', () => {
        it('JSON에서 Event를 복원할 수 있다', () => {
            const json = {
                id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                name: '사용자 등록됨',
                type: 'domain-event',
                position: { x: 100, y: 200 },
                description: '신규 사용자',
                createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
                lastModified: new Date('2024-01-02T00:00:00Z').toISOString(),
            };

            const event = Event.fromJSON(json);

            expect(event.id.value).toBe(json.id);
            expect(event.name.value).toBe(json.name);
            expect(event.type.value).toBe(json.type);
            expect(event.position.x).toBe(json.position.x);
            expect(event.position.y).toBe(json.position.y);
            expect(event.description).toBe(json.description);
        });
    });
});