import { describe, it, expect, beforeEach } from 'vitest';
import { EventStormingBoard } from '@domain/services/EventStormingBoard.ts';
import { BoardId } from '@domain/value-objects/BoardId.ts';
import { Event } from '@domain/entities/Event.ts';
import { EventName } from '@domain/value-objects/EventName.ts';
import { EventType } from '@domain/value-objects/EventType.ts';
import { Position } from '@domain/value-objects/Position.ts';
import { DomainError } from '@shared/errors/DomainError.ts';

describe('EventStormingBoard (Domain Service)', () => {
    let board: EventStormingBoard;

    beforeEach(() => {
        board = EventStormingBoard.create(BoardId.generate());
    });

    describe('생성', () => {
        it('빈 보드를 생성할 수 있다', () => {
            expect(board.getAllEvents()).toHaveLength(0);
            expect(board.getAllAggregates()).toHaveLength(0);
        });

        it('보드 ID가 설정된다', () => {
            expect(board.id).toBeDefined();
            expect(board.id).toBeInstanceOf(BoardId);
        });
    });

    describe('addEvent', () => {
        it('이벤트를 추가할 수 있다', () => {
            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });

            board.addEvent(event);

            expect(board.getAllEvents()).toHaveLength(1);
            expect(board.getAllEvents()).toContain(event);
        });

        it('여러 이벤트를 추가할 수 있다', () => {
            const event1 = Event.create({
                name: new EventName('이벤트1'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            const event2 = Event.create({
                name: new EventName('이벤트2'),
                type: new EventType('command'),
                position: new Position(300, 200),
            });

            board.addEvent(event1);
            board.addEvent(event2);

            expect(board.getAllEvents()).toHaveLength(2);
        });

        it('중복된 이벤트는 추가할 수 없다', () => {
            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });

            board.addEvent(event);

            expect(() => board.addEvent(event)).toThrow(DomainError);
            expect(() => board.addEvent(event)).toThrow('Event already exists on board');
        });

        it('위치가 겹치는 이벤트는 추가할 수 없다', () => {
            const event1 = Event.create({
                name: new EventName('이벤트1'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            const event2 = Event.create({
                name: new EventName('이벤트2'),
                type: new EventType('command'),
                position: new Position(105, 205),
            });

            board.addEvent(event1);

            expect(() => board.addEvent(event2)).toThrow(DomainError);
            expect(() => board.addEvent(event2)).toThrow('Event position overlaps with existing event');
        });

        it('충분히 떨어진 위치의 이벤트는 추가할 수 있다', () => {
            const event1 = Event.create({
                name: new EventName('이벤트1'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            const event2 = Event.create({
                name: new EventName('이벤트2'),
                type: new EventType('command'),
                position: new Position(200, 200),
            });

            board.addEvent(event1);
            board.addEvent(event2);

            expect(board.getAllEvents()).toHaveLength(2);
        });
    });

    describe('removeEvent', () => {
        let event: Event;

        beforeEach(() => {
            event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            board.addEvent(event);
        });

        it('이벤트를 제거할 수 있다', () => {
            board.removeEvent(event.id);

            expect(board.getAllEvents()).toHaveLength(0);
        });

        it('존재하지 않는 이벤트 제거 시 DomainError를 발생시킨다', () => {
            const nonExistentId = Event.create({
                name: new EventName('없는 이벤트'),
                type: new EventType('domain-event'),
                position: new Position(300, 300),
            }).id;

            expect(() => board.removeEvent(nonExistentId)).toThrow(DomainError);
            expect(() => board.removeEvent(nonExistentId)).toThrow('Event not found on board');
        });
    });

    describe('moveEvent', () => {
        let event: Event;

        beforeEach(() => {
            event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            board.addEvent(event);
        });

        it('이벤트를 이동할 수 있다', () => {
            const newPosition = new Position(300, 400);

            board.moveEvent(event.id, newPosition);

            const movedEvent = board.getEvent(event.id);
            expect(movedEvent?.position.equals(newPosition)).toBe(true);
        });

        it('다른 이벤트와 겹치는 위치로는 이동할 수 없다', () => {
            const event2 = Event.create({
                name: new EventName('이벤트2'),
                type: new EventType('command'),
                position: new Position(300, 200),
            });
            board.addEvent(event2);

            const overlappingPosition = new Position(305, 205);

            expect(() => board.moveEvent(event.id, overlappingPosition)).toThrow(DomainError);
        });

        it('보드 경계 밖으로는 이동할 수 없다', () => {
            const outOfBounds = new Position(10001, 200);

            expect(() => board.moveEvent(event.id, outOfBounds)).toThrow(DomainError);
        });

        it('존재하지 않는 이벤트 이동 시 DomainError를 발생시킨다', () => {
            const nonExistentId = Event.create({
                name: new EventName('없는 이벤트'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            }).id;

            expect(() => board.moveEvent(nonExistentId, new Position(300, 400))).toThrow(DomainError);
        });
    });

    describe('getEvent', () => {
        it('ID로 이벤트를 조회할 수 있다', () => {
            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            board.addEvent(event);

            const found = board.getEvent(event.id);

            expect(found).toBe(event);
        });

        it('존재하지 않는 ID는 undefined를 반환한다', () => {
            const nonExistentId = Event.create({
                name: new EventName('없는 이벤트'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            }).id;

            expect(board.getEvent(nonExistentId)).toBeUndefined();
        });
    });

    describe('detectAggregates', () => {
        it('근접한 이벤트들을 Aggregate로 그룹화한다', () => {
            // 클러스터 1: User 관련
            const userEvent1 = Event.create({
                name: new EventName('사용자 등록'),
                type: new EventType('command'),
                position: new Position(100, 200),
            });
            const userEvent2 = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(150, 200),
            });

            // 클러스터 2: Order 관련 (멀리 떨어짐)
            const orderEvent1 = Event.create({
                name: new EventName('주문 생성'),
                type: new EventType('command'),
                position: new Position(1000, 200),
            });
            const orderEvent2 = Event.create({
                name: new EventName('주문 생성됨'),
                type: new EventType('domain-event'),
                position: new Position(1050, 200),
            });

            board.addEvent(userEvent1);
            board.addEvent(userEvent2);
            board.addEvent(orderEvent1);
            board.addEvent(orderEvent2);

            const aggregates = board.detectAggregates();

            expect(aggregates).toHaveLength(2);
            expect(aggregates[0].getEventCount()).toBeGreaterThan(0);
            expect(aggregates[1].getEventCount()).toBeGreaterThan(0);
        });

        it('이벤트가 없으면 빈 배열을 반환한다', () => {
            const aggregates = board.detectAggregates();

            expect(aggregates).toHaveLength(0);
        });

        it('모든 이벤트가 멀리 떨어져 있으면 각각 별도 Aggregate가 된다', () => {
            const event1 = Event.create({
                name: new EventName('이벤트1'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            const event2 = Event.create({
                name: new EventName('이벤트2'),
                type: new EventType('domain-event'),
                position: new Position(1000, 200),
            });
            const event3 = Event.create({
                name: new EventName('이벤트3'),
                type: new EventType('domain-event'),
                position: new Position(2000, 200),
            });

            board.addEvent(event1);
            board.addEvent(event2);
            board.addEvent(event3);

            const aggregates = board.detectAggregates();

            expect(aggregates.length).toBeGreaterThan(0);
            aggregates.forEach(agg => {
                expect(agg.getEventCount()).toBeGreaterThan(0);
            });
        });

        it('감지된 Aggregate가 보드에 저장된다', () => {
            const event1 = Event.create({
                name: new EventName('이벤트1'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            const event2 = Event.create({
                name: new EventName('이벤트2'),
                type: new EventType('domain-event'),
                position: new Position(150, 200),
            });

            board.addEvent(event1);
            board.addEvent(event2);

            board.detectAggregates();

            expect(board.getAllAggregates().length).toBeGreaterThan(0);
        });
    });

    describe('validateFlow', () => {
        it('올바른 흐름은 검증을 통과한다', () => {
            const command = Event.create({
                name: new EventName('사용자 등록'),
                type: new EventType('command'),
                position: new Position(100, 200),
            });
            const domainEvent = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(200, 200),
            });

            board.addEvent(command);
            board.addEvent(domainEvent);

            const result = board.validateFlow();

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('Command 다음에 Event가 없으면 검증 실패', () => {
            const command = Event.create({
                name: new EventName('사용자 등록'),
                type: new EventType('command'),
                position: new Position(100, 200),
            });

            board.addEvent(command);

            const result = board.validateFlow();

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.includes('Command'))).toBe(true);
        });

        it('빈 보드는 검증을 통과한다', () => {
            const result = board.validateFlow();

            expect(result.isValid).toBe(true);
        });
    });

    describe('getEventsByType', () => {
        beforeEach(() => {
            board.addEvent(Event.create({
                name: new EventName('사용자 등록'),
                type: new EventType('command'),
                position: new Position(100, 200),
            }));
            board.addEvent(Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(200, 200),
            }));
            board.addEvent(Event.create({
                name: new EventName('주문 생성됨'),
                type: new EventType('domain-event'),
                position: new Position(300, 200),
            }));
        });

        it('특정 타입의 이벤트만 필터링할 수 있다', () => {
            const commands = board.getEventsByType(new EventType('command'));

            expect(commands).toHaveLength(1);
            expect(commands[0].name.value).toBe('사용자 등록');
        });

        it('domain-event 타입을 필터링할 수 있다', () => {
            const domainEvents = board.getEventsByType(new EventType('domain-event'));

            expect(domainEvents).toHaveLength(2);
        });

        it('존재하지 않는 타입은 빈 배열을 반환한다', () => {
            const policies = board.getEventsByType(new EventType('policy'));

            expect(policies).toHaveLength(0);
        });
    });

    describe('getEventsSortedByPosition', () => {
        it('이벤트들을 x 좌표 순으로 정렬한다', () => {
            const event3 = Event.create({
                name: new EventName('이벤트3'),
                type: new EventType('domain-event'),
                position: new Position(300, 200),
            });
            const event1 = Event.create({
                name: new EventName('이벤트1'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            const event2 = Event.create({
                name: new EventName('이벤트2'),
                type: new EventType('domain-event'),
                position: new Position(200, 200),
            });

            board.addEvent(event3);
            board.addEvent(event1);
            board.addEvent(event2);

            const sorted = board.getEventsSortedByPosition();

            expect(sorted[0].name.value).toBe('이벤트1');
            expect(sorted[1].name.value).toBe('이벤트2');
            expect(sorted[2].name.value).toBe('이벤트3');
        });

        it('빈 보드는 빈 배열을 반환한다', () => {
            const sorted = board.getEventsSortedByPosition();

            expect(sorted).toHaveLength(0);
        });
    });

    describe('clear', () => {
        it('모든 이벤트와 Aggregate를 제거한다', () => {
            board.addEvent(Event.create({
                name: new EventName('이벤트1'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            }));
            board.addEvent(Event.create({
                name: new EventName('이벤트2'),
                type: new EventType('domain-event'),
                position: new Position(200, 200),
            }));

            board.detectAggregates();

            board.clear();

            expect(board.getAllEvents()).toHaveLength(0);
            expect(board.getAllAggregates()).toHaveLength(0);
        });
    });

    describe('getEventCount', () => {
        it('이벤트 개수를 반환한다', () => {
            expect(board.getEventCount()).toBe(0);

            board.addEvent(Event.create({
                name: new EventName('이벤트1'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            }));

            expect(board.getEventCount()).toBe(1);
        });
    });

    describe('hasOverlappingEvent', () => {
        it('겹치는 이벤트가 있으면 true를 반환한다', () => {
            const event = Event.create({
                name: new EventName('이벤트'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            board.addEvent(event);

            expect(board.hasOverlappingEvent(new Position(105, 205))).toBe(true);
        });

        it('겹치는 이벤트가 없으면 false를 반환한다', () => {
            const event = Event.create({
                name: new EventName('이벤트'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            board.addEvent(event);

            expect(board.hasOverlappingEvent(new Position(300, 300))).toBe(false);
        });

        it('특정 이벤트를 제외하고 겹침을 확인할 수 있다', () => {
            const event = Event.create({
                name: new EventName('이벤트'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            board.addEvent(event);

            // 자기 자신의 위치는 제외하고 확인
            expect(board.hasOverlappingEvent(new Position(100, 200), event.id)).toBe(false);
        });
    });
});