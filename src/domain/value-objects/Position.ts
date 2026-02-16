import { DomainError } from '../../shared/errors/DomainError';

/**
 * Position Value Object
 *
 * Event Storming 보드 상의 좌표를 나타내는 불변 값 객체입니다.
 *
 * 비즈니스 규칙:
 * - 좌표는 0 이상이어야 함
 * - 보드 최대 크기는 10000 x 10000
 * - 불변 객체 (생성 후 변경 불가)
 */

// 도메인 상수
const BOARD_MAX_WIDTH = 10000;
const BOARD_MAX_HEIGHT = 10000;

export class Position {
    private readonly _x: number;
    private readonly _y: number;

    constructor(x: number, y: number) {
        // 비즈니스 규칙 검증: 음수 불가
        if (x < 0 || y < 0) {
            throw new DomainError('Position cannot be negative');
        }

        this._x = x;
        this._y = y;

        // 불변성 보장
        Object.freeze(this);
    }

    /**
     * x 좌표 getter
     */
    get x(): number {
        return this._x;
    }

    /**
     * y 좌표 getter
     */
    get y(): number {
        return this._y;
    }

    /**
     * 다른 Position까지의 유클리드 거리를 계산합니다.
     *
     * @param other - 거리를 계산할 다른 Position
     * @returns 두 점 사이의 거리
     *
     * @example
     * const pos1 = new Position(0, 0);
     * const pos2 = new Position(3, 4);
     * pos1.distanceTo(pos2); // returns 5
     */
    distanceTo(other: Position): number {
        const dx = this._x - other._x;
        const dy = this._y - other._y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 이 Position이 보드 경계 내에 있는지 확인합니다.
     *
     * @returns 경계 내에 있으면 true, 아니면 false
     */
    isWithinBounds(): boolean {
        return this._x <= BOARD_MAX_WIDTH && this._y <= BOARD_MAX_HEIGHT;
    }

    /**
     * Value Object 동등성 비교
     *
     * 두 Position의 x, y 좌표가 모두 같으면 동등한 것으로 간주합니다.
     *
     * @param other - 비교할 다른 Position
     * @returns 동등하면 true, 아니면 false
     */
    equals(other: Position): boolean {
        if (!(other instanceof Position)) {
            return false;
        }
        return this._x === other._x && this._y === other._y;
    }

    /**
     * JSON 직렬화
     *
     * @returns Position의 JSON 표현
     */
    toJSON(): { x: number; y: number } {
        return {
            x: this._x,
            y: this._y,
        };
    }

    /**
     * 문자열 표현
     *
     * @returns Position의 문자열 표현
     */
    toString(): string {
        return `Position(${this._x}, ${this._y})`;
    }

    /**
     * 정적 팩토리 메서드 - JSON에서 Position 생성
     *
     * @param json - { x: number, y: number } 형태의 객체
     * @returns Position 인스턴스
     */
    static fromJSON(json: { x: number; y: number }): Position {
        return new Position(json.x, json.y);
    }

    /**
     * 정적 팩토리 메서드 - 원점 (0, 0) Position 생성
     *
     * @returns 원점 Position
     */
    static origin(): Position {
        return new Position(0, 0);
    }
}

/**
 * 보드 상수 export (테스트에서 사용 가능)
 */
export const BOARD_CONSTANTS = {
    MAX_WIDTH: BOARD_MAX_WIDTH,
    MAX_HEIGHT: BOARD_MAX_HEIGHT,
} as const;