// tests/domain/value-objects/EventName.test.ts
import { describe, it, expect } from 'vitest';
import { EventName } from '@domain/value-objects/EventName';
import { DomainError } from '@shared/errors/DomainError';

describe('EventName (Value Object)', () => {
    describe('생성', () => {
        it('유효한 이름으로 생성할 수 있다', () => {
            const name = new EventName('사용자 등록됨');

            expect(name.value).toBe('사용자 등록됨');
        });

        it('영문 이름으로 생성할 수 있다', () => {
            const name = new EventName('User Registered');

            expect(name.value).toBe('User Registered');
        });

        it('특수문자를 포함할 수 있다', () => {
            const name = new EventName('주문_완료됨 (결제 성공)');

            expect(name.value).toBe('주문_완료됨 (결제 성공)');
        });

        it('빈 문자열은 DomainError를 발생시킨다', () => {
            expect(() => new EventName('')).toThrow(DomainError);
            expect(() => new EventName('')).toThrow('Event name cannot be empty');
        });

        it('공백만 있는 문자열은 DomainError를 발생시킨다', () => {
            expect(() => new EventName('   ')).toThrow(DomainError);
        });

        it('200자를 초과하면 DomainError를 발생시킨다', () => {
            const longName = 'a'.repeat(201);

            expect(() => new EventName(longName)).toThrow(DomainError);
            expect(() => new EventName(longName)).toThrow('Event name too long');
        });

        it('정확히 200자는 허용된다', () => {
            const maxName = 'a'.repeat(200);
            const name = new EventName(maxName);

            expect(name.value).toBe(maxName);
        });

        it('앞뒤 공백은 자동으로 제거된다', () => {
            const name = new EventName('  사용자 등록됨  ');

            expect(name.value).toBe('사용자 등록됨');
        });
    });

    describe('isEmpty', () => {
        it('비어있지 않은 이름은 false를 반환한다', () => {
            const name = new EventName('사용자 등록됨');

            expect(name.isEmpty()).toBe(false);
        });

        // Note: 빈 이름은 생성 시점에 차단되므로 테스트 불가
    });

    describe('length', () => {
        it('이름의 길이를 반환한다', () => {
            const name = new EventName('사용자 등록됨');

            expect(name.length).toBe(7);
        });

        it('공백도 길이에 포함된다', () => {
            const name = new EventName('User Registered');

            expect(name.length).toBe(15);
        });
    });

    describe('equals', () => {
        it('같은 이름은 동등하다', () => {
            const name1 = new EventName('사용자 등록됨');
            const name2 = new EventName('사용자 등록됨');

            expect(name1.equals(name2)).toBe(true);
        });

        it('다른 이름은 동등하지 않다', () => {
            const name1 = new EventName('사용자 등록됨');
            const name2 = new EventName('주문 완료됨');

            expect(name1.equals(name2)).toBe(false);
        });

        it('대소문자를 구분한다', () => {
            const name1 = new EventName('User Registered');
            const name2 = new EventName('user registered');

            expect(name1.equals(name2)).toBe(false);
        });
    });
});