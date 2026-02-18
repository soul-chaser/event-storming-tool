import { describe, it, expect } from 'vitest';
import { EventId } from '@domain/value-objects/EventId';
import { DomainError } from '@shared/errors/DomainError';

describe('EventId (Value Object)', () => {
    describe('생성', () => {
        it('유효한 UUID로 EventId를 생성할 수 있다', () => {
            const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
            const eventId = new EventId(uuid);

            expect(eventId.value).toBe(uuid);
        });

        it('소문자 UUID로 생성할 수 있다', () => {
            const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
            const eventId = new EventId(uuid);

            expect(eventId.value).toBe(uuid);
        });

        it('대문자 UUID로 생성하면 소문자로 정규화된다', () => {
            const uuid = 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11';
            const eventId = new EventId(uuid);

            expect(eventId.value).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
        });

        it('유효하지 않은 UUID 형식은 DomainError를 발생시킨다', () => {
            expect(() => new EventId('invalid-uuid')).toThrow(DomainError);
            expect(() => new EventId('invalid-uuid')).toThrow('Invalid UUID format');
        });

        it('빈 문자열은 DomainError를 발생시킨다', () => {
            expect(() => new EventId('')).toThrow(DomainError);
            expect(() => new EventId('')).toThrow('Invalid UUID format');
        });

        it('하이픈이 없는 UUID는 DomainError를 발생시킨다', () => {
            const uuidWithoutHyphens = 'a0eebc999c0b4ef8bb6d6bb9bd380a11';
            expect(() => new EventId(uuidWithoutHyphens)).toThrow(DomainError);
        });

        it('너무 짧은 문자열은 DomainError를 발생시킨다', () => {
            expect(() => new EventId('123')).toThrow(DomainError);
        });

        it('특수문자가 포함된 문자열은 DomainError를 발생시킨다', () => {
            expect(() => new EventId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1!')).toThrow(DomainError);
        });
    });

    describe('generate', () => {
        it('새로운 UUID를 생성할 수 있다', () => {
            const eventId = EventId.generate();

            expect(eventId).toBeInstanceOf(EventId);
            expect(eventId.value).toBeDefined();
            expect(eventId.value.length).toBe(36); // UUID 표준 길이
        });

        it('생성된 UUID는 유효한 형식이다', () => {
            const eventId = EventId.generate();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            expect(uuidRegex.test(eventId.value)).toBe(true);
        });

        it('연속 생성 시 각각 다른 UUID를 생성한다', () => {
            const id1 = EventId.generate();
            const id2 = EventId.generate();
            const id3 = EventId.generate();

            expect(id1.value).not.toBe(id2.value);
            expect(id2.value).not.toBe(id3.value);
            expect(id1.value).not.toBe(id3.value);
        });

        it('대량 생성 시 중복이 없다', () => {
            const ids = new Set<string>();
            const count = 1000;

            for (let i = 0; i < count; i++) {
                ids.add(EventId.generate().value);
            }

            expect(ids.size).toBe(count);
        });
    });

    describe('equals', () => {
        it('같은 UUID를 가진 EventId는 동등하다', () => {
            const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
            const id1 = new EventId(uuid);
            const id2 = new EventId(uuid);

            expect(id1.equals(id2)).toBe(true);
        });

        it('다른 UUID를 가진 EventId는 동등하지 않다', () => {
            const id1 = new EventId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
            const id2 = new EventId('b1ffcd88-8d1a-4ef9-8c7e-7cc8ce491b22');

            expect(id1.equals(id2)).toBe(false);
        });

        it('대소문자가 다른 같은 UUID는 동등하다', () => {
            const id1 = new EventId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
            const id2 = new EventId('A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11');

            expect(id1.equals(id2)).toBe(true);
        });

        it('자기 자신과는 항상 동등하다', () => {
            const eventId = EventId.generate();

            expect(eventId.equals(eventId)).toBe(true);
        });
    });

    describe('toString', () => {
        it('UUID 문자열을 반환한다', () => {
            const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
            const eventId = new EventId(uuid);

            expect(eventId.toString()).toBe(uuid);
        });
    });

    describe('toJSON', () => {
        it('UUID 문자열을 반환한다', () => {
            const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
            const eventId = new EventId(uuid);

            expect(eventId.toJSON()).toBe(uuid);
        });

        it('JSON.stringify와 함께 사용할 수 있다', () => {
            const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
            const eventId = new EventId(uuid);
            const json = JSON.stringify({ id: eventId });

            expect(json).toBe(`{"id":"${uuid}"}`);
        });
    });

    describe('fromJSON', () => {
        it('JSON 문자열에서 EventId를 생성할 수 있다', () => {
            const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
            const eventId = EventId.fromJSON(uuid);

            expect(eventId).toBeInstanceOf(EventId);
            expect(eventId.value).toBe(uuid);
        });

        it('유효하지 않은 JSON은 DomainError를 발생시킨다', () => {
            expect(() => EventId.fromJSON('invalid')).toThrow(DomainError);
        });
    });

    describe('Value Object 불변성', () => {
        it('EventId는 불변 객체여야 한다', () => {
            const eventId = EventId.generate();

            expect(() => {
                (eventId as any).value = 'new-value';
            }).toThrow();
        });

        it('생성 후 값을 변경할 수 없다', () => {
            const eventId = EventId.generate();
            const originalValue = eventId.value;

            // 값 변경 시도
            try {
                (eventId as any).value = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
            } catch (e) {
                // 예외 발생 예상
            }

            // 값이 변경되지 않았는지 확인
            expect(eventId.value).toBe(originalValue);
        });
    });
});