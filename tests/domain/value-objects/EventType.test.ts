// tests/domain/value-objects/EventType.test.ts
import { describe, it, expect } from 'vitest';
import { EventType } from '../../../src/domain/value-objects/EventType';
import { DomainError } from '../../../src/shared/errors/DomainError';

describe('EventType (Value Object)', () => {
    describe('생성', () => {
        it('유효한 domain-event 타입으로 생성할 수 있다', () => {
            const eventType = new EventType('domain-event');

            expect(eventType.value).toBe('domain-event');
        });

        it('유효한 command 타입으로 생성할 수 있다', () => {
            const eventType = new EventType('command');

            expect(eventType.value).toBe('command');
        });

        it('유효한 policy 타입으로 생성할 수 있다', () => {
            const eventType = new EventType('policy');

            expect(eventType.value).toBe('policy');
        });

        it('유효한 aggregate 타입으로 생성할 수 있다', () => {
            const eventType = new EventType('aggregate');

            expect(eventType.value).toBe('aggregate');
        });

        it('유효한 external-system 타입으로 생성할 수 있다', () => {
            const eventType = new EventType('external-system');

            expect(eventType.value).toBe('external-system');
        });

        it('유효한 read-model 타입으로 생성할 수 있다', () => {
            const eventType = new EventType('read-model');

            expect(eventType.value).toBe('read-model');
        });

        it('유효하지 않은 타입은 DomainError를 발생시킨다', () => {
            expect(() => new EventType('invalid-type')).toThrow(DomainError);
            expect(() => new EventType('invalid-type')).toThrow('Invalid event type');
        });

        it('빈 문자열은 DomainError를 발생시킨다', () => {
            expect(() => new EventType('')).toThrow(DomainError);
        });

        it('대소문자를 구분한다', () => {
            expect(() => new EventType('DOMAIN-EVENT')).toThrow(DomainError);
            expect(() => new EventType('Command')).toThrow(DomainError);
        });
    });

    describe('getColor', () => {
        it('domain-event는 오렌지 색상을 반환한다', () => {
            const eventType = new EventType('domain-event');

            expect(eventType.getColor()).toBe('#FFA500');
        });

        it('command는 하늘색을 반환한다', () => {
            const eventType = new EventType('command');

            expect(eventType.getColor()).toBe('#87CEEB');
        });

        it('aggregate는 노란색을 반환한다', () => {
            const eventType = new EventType('aggregate');

            expect(eventType.getColor()).toBe('#FFD700');
        });

        it('policy는 보라색을 반환한다', () => {
            const eventType = new EventType('policy');

            expect(eventType.getColor()).toBe('#DDA0DD');
        });

        it('external-system은 분홍색을 반환한다', () => {
            const eventType = new EventType('external-system');

            expect(eventType.getColor()).toBe('#FFB6C1');
        });

        it('read-model은 초록색을 반환한다', () => {
            const eventType = new EventType('read-model');

            expect(eventType.getColor()).toBe('#90EE90');
        });
    });

    describe('타입 체크 메서드', () => {
        it('isDomainEvent는 domain-event일 때 true를 반환한다', () => {
            const eventType = new EventType('domain-event');

            expect(eventType.isDomainEvent()).toBe(true);
            expect(eventType.isCommand()).toBe(false);
        });

        it('isCommand는 command일 때 true를 반환한다', () => {
            const eventType = new EventType('command');

            expect(eventType.isCommand()).toBe(true);
            expect(eventType.isDomainEvent()).toBe(false);
        });

        it('isPolicy는 policy일 때 true를 반환한다', () => {
            const eventType = new EventType('policy');

            expect(eventType.isPolicy()).toBe(true);
            expect(eventType.isCommand()).toBe(false);
        });

        it('isAggregate는 aggregate일 때 true를 반환한다', () => {
            const eventType = new EventType('aggregate');

            expect(eventType.isAggregate()).toBe(true);
            expect(eventType.isDomainEvent()).toBe(false);
        });
    });

    describe('equals', () => {
        it('같은 타입의 EventType은 동등하다', () => {
            const type1 = new EventType('domain-event');
            const type2 = new EventType('domain-event');

            expect(type1.equals(type2)).toBe(true);
        });

        it('다른 타입의 EventType은 동등하지 않다', () => {
            const type1 = new EventType('domain-event');
            const type2 = new EventType('command');

            expect(type1.equals(type2)).toBe(false);
        });
    });
});