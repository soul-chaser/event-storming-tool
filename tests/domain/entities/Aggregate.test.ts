import { describe, it, expect, beforeEach } from 'vitest';
import { Aggregate } from '@domain/entities/Aggregate';
import { AggregateId } from '@domain/value-objects/AggregateId';
import { AggregateName } from '@domain/value-objects/AggregateName';
import { Event } from '@domain/entities/Event';
import { EventName } from '@domain/value-objects/EventName';
import { EventType } from '@domain/value-objects/EventType';
import { Position } from '@domain/value-objects/Position';
import { DomainError } from '@shared/errors/DomainError';

describe('Aggregate (Entity)', () => {
    let domainEvent1: Event;
    let domainEvent2: Event;
    let command: Event;

    beforeEach(() => {
        domainEvent1 = Event.create({
            name: new EventName('사용자 등록됨'),
            type: new EventType('domain-event'),
            position: new Position(100, 200),
        });

        domainEvent2 = Event.create({
            name: new EventName('이메일 인증됨'),
            type: new EventType('domain-event'),
            position: new Position(120, 200),
        });

        command = Event.create({
            name: new EventName('사용자 등록'),
            type: new EventType('command'),
            position: new Position(80, 200),
        });
    });

    describe('생성', () => {
        it('유효한 속성으로 Aggregate를 생성할 수 있다', () => {
            const id = AggregateId.generate();
            const name = new AggregateName('User');
            const events = [domainEvent1, domainEvent2];

            const aggregate = new Aggregate({ id, name, events });

            expect(aggregate.id).toBe(id);
            expect(aggregate.name).toBe(name);
            expect(aggregate.events).toEqual(events);
        });

        it('빈 이벤트 목록으로 Aggregate를 생성할 수 있다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [],
            });

            expect(aggregate.events).toHaveLength(0);
        });

        it('Command도 포함할 수 있다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [command, domainEvent1],
            });

            expect(aggregate.events).toHaveLength(2);
            expect(aggregate.hasCommands()).toBe(true);
        });

        it('생성 시 타임스탬프가 자동으로 설정된다', () => {
            const before = new Date();

            const aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [domainEvent1],
            });

            const after = new Date();

            expect(aggregate.createdAt).toBeInstanceOf(Date);
            expect(aggregate.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(aggregate.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe('addEvent', () => {
        let aggregate: Aggregate;

        beforeEach(() => {
            aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [domainEvent1],
            });
        });

        it('이벤트를 추가할 수 있다', () => {
            aggregate.addEvent(domainEvent2);

            expect(aggregate.events).toHaveLength(2);
            expect(aggregate.events).toContain(domainEvent2);
        });

        it('중복된 이벤트는 추가할 수 없다', () => {
            expect(() => aggregate.addEvent(domainEvent1)).toThrow(DomainError);
            expect(() => aggregate.addEvent(domainEvent1)).toThrow('Event already exists in this aggregate');
        });

        it('너무 멀리 떨어진 이벤트는 추가할 수 없다', () => {
            const farAwayEvent = Event.create({
                name: new EventName('먼 이벤트'),
                type: new EventType('domain-event'),
                position: new Position(5000, 5000),
            });

            expect(() => aggregate.addEvent(farAwayEvent)).toThrow(DomainError);
            expect(() => aggregate.addEvent(farAwayEvent)).toThrow('Event too far from aggregate');
        });

        it('적절한 거리의 이벤트는 추가할 수 있다', () => {
            const nearbyEvent = Event.create({
                name: new EventName('가까운 이벤트'),
                type: new EventType('domain-event'),
                position: new Position(150, 200),
            });

            aggregate.addEvent(nearbyEvent);

            expect(aggregate.events).toContain(nearbyEvent);
        });

        it('이벤트 추가 시 lastModified가 갱신된다', async () => {
            const originalModified = aggregate.lastModified;

            await new Promise(resolve => setTimeout(resolve, 10));

            aggregate.addEvent(domainEvent2);

            expect(aggregate.lastModified.getTime()).toBeGreaterThan(originalModified.getTime());
        });
    });

    describe('removeEvent', () => {
        let aggregate: Aggregate;

        beforeEach(() => {
            aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [domainEvent1, domainEvent2],
            });
        });

        it('이벤트를 제거할 수 있다', () => {
            aggregate.removeEvent(domainEvent1.id);

            expect(aggregate.events).toHaveLength(1);
            expect(aggregate.events).not.toContain(domainEvent1);
        });

        it('존재하지 않는 이벤트 제거 시 DomainError를 발생시킨다', () => {
            const nonExistentId = Event.create({
                name: new EventName('없는 이벤트'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            }).id;

            expect(() => aggregate.removeEvent(nonExistentId)).toThrow(DomainError);
            expect(() => aggregate.removeEvent(nonExistentId)).toThrow('Event not found in this aggregate');
        });

        it('마지막 이벤트도 제거할 수 있다', () => {
            aggregate.removeEvent(domainEvent1.id);
            aggregate.removeEvent(domainEvent2.id);

            expect(aggregate.events).toHaveLength(0);
        });

        it('이벤트 제거 시 lastModified가 갱신된다', async () => {
            const originalModified = aggregate.lastModified;

            await new Promise(resolve => setTimeout(resolve, 10));

            aggregate.removeEvent(domainEvent1.id);

            expect(aggregate.lastModified.getTime()).toBeGreaterThan(originalModified.getTime());
        });
    });

    describe('changeName', () => {
        let aggregate: Aggregate;

        beforeEach(() => {
            aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [domainEvent1],
            });
        });

        it('이름을 변경할 수 있다', () => {
            const newName = new AggregateName('Account');

            aggregate.changeName(newName);

            expect(aggregate.name.equals(newName)).toBe(true);
        });

        it('이름 변경 시 lastModified가 갱신된다', async () => {
            const originalModified = aggregate.lastModified;

            await new Promise(resolve => setTimeout(resolve, 10));

            aggregate.changeName(new AggregateName('Account'));

            expect(aggregate.lastModified.getTime()).toBeGreaterThan(originalModified.getTime());
        });
    });

    describe('getBounds', () => {
        it('이벤트들을 포함하는 경계를 계산한다', () => {
            const event1 = Event.create({
                name: new EventName('이벤트1'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            const event2 = Event.create({
                name: new EventName('이벤트2'),
                type: new EventType('domain-event'),
                position: new Position(300, 400),
            });

            const aggregate = Aggregate.create({
                name: new AggregateName('Test'),
                events: [event1, event2],
            });

            const bounds = aggregate.getBounds();

            expect(bounds).toBeDefined();
            expect(bounds!.minX).toBeLessThanOrEqual(100);
            expect(bounds!.maxX).toBeGreaterThanOrEqual(300);
            expect(bounds!.minY).toBeLessThanOrEqual(200);
            expect(bounds!.maxY).toBeGreaterThanOrEqual(400);
        });

        it('이벤트가 없으면 undefined를 반환한다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('Empty'),
                events: [],
            });

            expect(aggregate.getBounds()).toBeUndefined();
        });

        it('단일 이벤트의 경우 해당 위치를 중심으로 경계를 반환한다', () => {
            const event = Event.create({
                name: new EventName('단일 이벤트'),
                type: new EventType('domain-event'),
                position: new Position(150, 250),
            });

            const aggregate = Aggregate.create({
                name: new AggregateName('Single'),
                events: [event],
            });

            const bounds = aggregate.getBounds();

            expect(bounds).toBeDefined();
            expect(bounds!.minX).toBeDefined();
            expect(bounds!.maxX).toBeDefined();
        });
    });

    describe('hasCommands', () => {
        it('Command가 포함되어 있으면 true를 반환한다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [command, domainEvent1],
            });

            expect(aggregate.hasCommands()).toBe(true);
        });

        it('Command가 없으면 false를 반환한다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [domainEvent1, domainEvent2],
            });

            expect(aggregate.hasCommands()).toBe(false);
        });

        it('빈 Aggregate는 false를 반환한다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [],
            });

            expect(aggregate.hasCommands()).toBe(false);
        });
    });

    describe('hasDomainEvents', () => {
        it('DomainEvent가 포함되어 있으면 true를 반환한다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [domainEvent1],
            });

            expect(aggregate.hasDomainEvents()).toBe(true);
        });

        it('DomainEvent가 없으면 false를 반환한다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [command],
            });

            expect(aggregate.hasDomainEvents()).toBe(false);
        });

        it('빈 Aggregate는 false를 반환한다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [],
            });

            expect(aggregate.hasDomainEvents()).toBe(false);
        });
    });

    describe('getEventCount', () => {
        it('이벤트 개수를 반환한다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [domainEvent1, domainEvent2, command],
            });

            expect(aggregate.getEventCount()).toBe(3);
        });

        it('빈 Aggregate는 0을 반환한다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [],
            });

            expect(aggregate.getEventCount()).toBe(0);
        });
    });

    describe('containsEvent', () => {
        let aggregate: Aggregate;

        beforeEach(() => {
            aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [domainEvent1, domainEvent2],
            });
        });

        it('포함된 이벤트는 true를 반환한다', () => {
            expect(aggregate.containsEvent(domainEvent1.id)).toBe(true);
            expect(aggregate.containsEvent(domainEvent2.id)).toBe(true);
        });

        it('포함되지 않은 이벤트는 false를 반환한다', () => {
            expect(aggregate.containsEvent(command.id)).toBe(false);
        });
    });

    describe('getCenter', () => {
        it('모든 이벤트의 중심점을 계산한다', () => {
            const event1 = Event.create({
                name: new EventName('이벤트1'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            const event2 = Event.create({
                name: new EventName('이벤트2'),
                type: new EventType('domain-event'),
                position: new Position(300, 400),
            });

            const aggregate = Aggregate.create({
                name: new AggregateName('Test'),
                events: [event1, event2],
            });

            const center = aggregate.getCenter();

            expect(center).toBeDefined();
            expect(center!.x).toBe(200); // (100 + 300) / 2
            expect(center!.y).toBe(300); // (200 + 400) / 2
        });

        it('이벤트가 없으면 undefined를 반환한다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('Empty'),
                events: [],
            });

            expect(aggregate.getCenter()).toBeUndefined();
        });
    });

    describe('Entity 동일성', () => {
        it('같은 ID를 가진 Aggregate는 동일하다', () => {
            const id = AggregateId.generate();
            const agg1 = new Aggregate({
                id,
                name: new AggregateName('User'),
                events: [domainEvent1],
            });
            const agg2 = new Aggregate({
                id,
                name: new AggregateName('Account'),
                events: [domainEvent2],
            });

            expect(agg1.equals(agg2)).toBe(true);
        });

        it('다른 ID를 가진 Aggregate는 동일하지 않다', () => {
            const agg1 = Aggregate.create({
                name: new AggregateName('User'),
                events: [domainEvent1],
            });
            const agg2 = Aggregate.create({
                name: new AggregateName('User'),
                events: [domainEvent1],
            });

            expect(agg1.equals(agg2)).toBe(false);
        });

        it('자기 자신과는 항상 동일하다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [domainEvent1],
            });

            expect(aggregate.equals(aggregate)).toBe(true);
        });
    });

    describe('toJSON', () => {
        it('JSON 직렬화가 가능하다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('User'),
                events: [domainEvent1, domainEvent2],
            });

            const json = aggregate.toJSON();

            expect(json).toMatchObject({
                id: aggregate.id.value,
                name: 'User',
            });
            expect(json.eventIds).toHaveLength(2);
            expect(json.eventIds).toContain(domainEvent1.id.value);
            expect(json.eventIds).toContain(domainEvent2.id.value);
            expect(json.createdAt).toBeDefined();
            expect(json.lastModified).toBeDefined();
        });

        it('빈 Aggregate도 직렬화 가능하다', () => {
            const aggregate = Aggregate.create({
                name: new AggregateName('Empty'),
                events: [],
            });

            const json = aggregate.toJSON();

            expect(json.eventIds).toHaveLength(0);
        });
    });

    describe('정적 팩토리 메서드', () => {
        it('fromEvents로 이벤트 배열에서 Aggregate를 생성할 수 있다', () => {
            const events = [domainEvent1, domainEvent2];

            const aggregate = Aggregate.fromEvents(new AggregateName('User'), events);

            expect(aggregate).toBeInstanceOf(Aggregate);
            expect(aggregate.events).toHaveLength(2);
            expect(aggregate.name.value).toBe('User');
        });
    });
});