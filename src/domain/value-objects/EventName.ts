import { DomainError } from '../../shared/errors/DomainError';

/**
 * EventName Value Object
 *
 * Event Storming에서 이벤트의 이름을 나타내는 불변 값 객체입니다.
 *
 * 비즈니스 규칙:
 * - 이름은 비어있을 수 없음 (공백만 있는 경우도 불가)
 * - 최대 길이는 200자
 * - 앞뒤 공백은 자동으로 제거됨
 * - 불변 객체 (생성 후 변경 불가)
 */

// 도메인 상수
const MAX_NAME_LENGTH = 200;

export class EventName {
    private readonly _value: string;

    constructor(value: string) {
        // 앞뒤 공백 제거
        const trimmedValue = value.trim();

        // 비즈니스 규칙 검증: 빈 문자열 불가
        if (trimmedValue.length === 0) {
            throw new DomainError('Event name cannot be empty');
        }

        // 비즈니스 규칙 검증: 최대 길이
        if (trimmedValue.length > MAX_NAME_LENGTH) {
            throw new DomainError(`Event name too long (max ${MAX_NAME_LENGTH} characters)`);
        }

        this._value = trimmedValue;

        // 불변성 보장
        Object.freeze(this);
    }

    /**
     * 이름 값 getter
     */
    get value(): string {
        return this._value;
    }

    /**
     * 이름이 비어있는지 확인합니다.
     *
     * Note: 생성자에서 이미 빈 문자열을 차단하므로,
     * 이 메서드는 항상 false를 반환합니다.
     * 하지만 명시적인 API를 위해 제공합니다.
     *
     * @returns 비어있으면 true, 아니면 false
     */
    isEmpty(): boolean {
        return this._value.length === 0;
    }

    /**
     * 이름의 길이를 반환합니다.
     *
     * @returns 이름의 문자 길이
     */
    get length(): number {
        return this._value.length;
    }

    /**
     * Value Object 동등성 비교
     *
     * 두 EventName의 값이 같으면 동등한 것으로 간주합니다.
     * (대소문자 구분)
     *
     * @param other - 비교할 다른 EventName
     * @returns 동등하면 true, 아니면 false
     */
    equals(other: EventName): boolean {
        if (!(other instanceof EventName)) {
            return false;
        }
        return this._value === other._value;
    }

    /**
     * JSON 직렬화
     *
     * @returns EventName의 JSON 표현
     */
    toJSON(): string {
        return this._value;
    }

    /**
     * 문자열 표현
     *
     * @returns EventName의 문자열 표현
     */
    toString(): string {
        return this._value;
    }

    /**
     * 정적 팩토리 메서드 - JSON에서 EventName 생성
     *
     * @param json - 문자열 값
     * @returns EventName 인스턴스
     */
    static fromJSON(json: string): EventName {
        return new EventName(json);
    }
}

/**
 * EventName 상수 export (테스트에서 사용 가능)
 */
export const EVENT_NAME_CONSTANTS = {
    MAX_LENGTH: MAX_NAME_LENGTH,
} as const;