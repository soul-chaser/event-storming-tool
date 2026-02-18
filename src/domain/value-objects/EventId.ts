import { DomainError } from '../../shared/errors/DomainError.js';
import { randomUUID } from 'crypto';

/**
 * EventId Value Object
 *
 * Event의 고유 식별자를 나타내는 불변 값 객체입니다.
 * UUID v4 형식을 사용합니다.
 *
 * 비즈니스 규칙:
 * - UUID v4 형식이어야 함
 * - 소문자로 정규화됨
 * - 불변 객체
 *
 * UUID 형식: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * - x: 16진수 숫자 (0-9, a-f)
 * - y: 8, 9, a, 또는 b
 */

// UUID v4 정규표현식
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class EventId {
    private readonly _value: string;

    constructor(value: string) {
        // 소문자로 정규화
        const normalizedValue = value.toLowerCase();

        // 비즈니스 규칙 검증: UUID v4 형식
        if (!this.isValidUUID(normalizedValue)) {
            throw new DomainError('Invalid UUID format for EventId');
        }

        this._value = normalizedValue;

        // 불변성 보장
        Object.freeze(this);
    }

    /**
     * UUID 값 getter
     */
    get value(): string {
        return this._value;
    }

    /**
     * 새로운 EventId를 생성합니다.
     *
     * UUID v4를 사용하여 고유한 ID를 생성합니다.
     *
     * @returns 새로운 EventId 인스턴스
     *
     * @example
     * const id = EventId.generate();
     * console.log(id.value); // 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
     */
    static generate(): EventId {
        return new EventId(randomUUID());
    }

    /**
     * Value Object 동등성 비교
     *
     * UUID가 같으면 동등한 것으로 간주합니다.
     * (대소문자 무시)
     *
     * @param other - 비교할 다른 EventId
     * @returns 동등하면 true
     */
    equals(other: EventId): boolean {
        if (!(other instanceof EventId)) {
            return false;
        }
        return this._value === other._value;
    }

    /**
     * UUID 유효성 검증
     *
     * @param value - 검증할 문자열
     * @returns 유효한 UUID v4이면 true
     */
    private isValidUUID(value: string): boolean {
        if (!value || typeof value !== 'string') {
            return false;
        }
        return UUID_V4_REGEX.test(value);
    }

    /**
     * JSON 직렬화
     *
     * @returns UUID 문자열
     */
    toJSON(): string {
        return this._value;
    }

    /**
     * 문자열 표현
     *
     * @returns UUID 문자열
     */
    toString(): string {
        return this._value;
    }

    /**
     * 정적 팩토리 메서드 - JSON에서 EventId 생성
     *
     * @param json - UUID 문자열
     * @returns EventId 인스턴스
     */
    static fromJSON(json: string): EventId {
        return new EventId(json);
    }

    /**
     * 정적 팩토리 메서드 - 문자열에서 EventId 생성
     *
     * @param value - UUID 문자열
     * @returns EventId 인스턴스
     */
    static fromString(value: string): EventId {
        return new EventId(value);
    }
}