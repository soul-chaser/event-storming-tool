// tests/domain/value-objects/Position.test.ts
import { describe, it, expect } from 'vitest';
import { Position } from '../../../src/domain/value-objects/Position';
import { DomainError } from '../../../src/shared/errors/DomainError';

describe('Position (Value Object)', () => {
    describe('생성', () => {
        it('유효한 좌표로 Position을 생성할 수 있다', () => {
            // Arrange & Act
            const position = new Position(100, 200);

            // Assert
            expect(position.x).toBe(100);
            expect(position.y).toBe(200);
        });

        it('0, 0 좌표로 Position을 생성할 수 있다', () => {
            const position = new Position(0, 0);

            expect(position.x).toBe(0);
            expect(position.y).toBe(0);
        });

        it('음수 x 좌표는 DomainError를 발생시킨다', () => {
            expect(() => new Position(-1, 100)).toThrow(DomainError);
            expect(() => new Position(-1, 100)).toThrow('Position cannot be negative');
        });

        it('음수 y 좌표는 DomainError를 발생시킨다', () => {
            expect(() => new Position(100, -1)).toThrow(DomainError);
            expect(() => new Position(100, -1)).toThrow('Position cannot be negative');
        });

        it('두 좌표 모두 음수인 경우 DomainError를 발생시킨다', () => {
            expect(() => new Position(-10, -20)).toThrow(DomainError);
        });
    });

    describe('distanceTo', () => {
        it('같은 위치의 거리는 0이다', () => {
            const pos1 = new Position(100, 100);
            const pos2 = new Position(100, 100);

            expect(pos1.distanceTo(pos2)).toBe(0);
        });

        it('수평 거리를 올바르게 계산한다', () => {
            const pos1 = new Position(0, 0);
            const pos2 = new Position(100, 0);

            expect(pos1.distanceTo(pos2)).toBe(100);
        });

        it('수직 거리를 올바르게 계산한다', () => {
            const pos1 = new Position(0, 0);
            const pos2 = new Position(0, 100);

            expect(pos1.distanceTo(pos2)).toBe(100);
        });

        it('대각선 거리를 올바르게 계산한다 (피타고라스)', () => {
            const pos1 = new Position(0, 0);
            const pos2 = new Position(3, 4);

            expect(pos1.distanceTo(pos2)).toBe(5);
        });

        it('거리 계산은 대칭적이다 (A->B === B->A)', () => {
            const pos1 = new Position(10, 20);
            const pos2 = new Position(50, 80);

            expect(pos1.distanceTo(pos2)).toBe(pos2.distanceTo(pos1));
        });
    });

    describe('isWithinBounds', () => {
        it('보드 경계 내의 Position은 true를 반환한다', () => {
            const position = new Position(500, 500);

            expect(position.isWithinBounds()).toBe(true);
        });

        it('최대 x 좌표에 있는 Position은 true를 반환한다', () => {
            const position = new Position(10000, 500);

            expect(position.isWithinBounds()).toBe(true);
        });

        it('최대 y 좌표에 있는 Position은 true를 반환한다', () => {
            const position = new Position(500, 10000);

            expect(position.isWithinBounds()).toBe(true);
        });

        it('보드 경계를 벗어난 Position은 false를 반환한다', () => {
            const position = new Position(10001, 500);

            expect(position.isWithinBounds()).toBe(false);
        });

        it('y 좌표가 보드 경계를 벗어나면 false를 반환한다', () => {
            const position = new Position(500, 10001);

            expect(position.isWithinBounds()).toBe(false);
        });
    });

    describe('equals', () => {
        it('같은 좌표의 Position은 동등하다', () => {
            const pos1 = new Position(100, 200);
            const pos2 = new Position(100, 200);

            expect(pos1.equals(pos2)).toBe(true);
        });

        it('x 좌표가 다르면 동등하지 않다', () => {
            const pos1 = new Position(100, 200);
            const pos2 = new Position(101, 200);

            expect(pos1.equals(pos2)).toBe(false);
        });

        it('y 좌표가 다르면 동등하지 않다', () => {
            const pos1 = new Position(100, 200);
            const pos2 = new Position(100, 201);

            expect(pos1.equals(pos2)).toBe(false);
        });

        it('자기 자신과는 항상 동등하다', () => {
            const position = new Position(100, 200);

            expect(position.equals(position)).toBe(true);
        });
    });

    describe('Value Object 불변성', () => {
        it('Position은 불변 객체여야 한다', () => {
            const position = new Position(100, 200);

            // TypeScript에서는 컴파일 시점에 막히지만, 런타임 체크
            expect(() => {
                (position as any).x = 999;
            }).toThrow();
        });
    });
});