import { DomainError } from '../../shared/errors/DomainError.js';

/**
 * AggregateName Value Object
 *
 * Aggregate의 이름을 나타내는 불변 값 객체입니다.
 *
 * 비즈니스 규칙:
 * - 이름은 비어있을 수 없음
 * - 최대 길이는 100자 (EventName보다 짧음)
 * - 앞뒤 공백은 자동으로 제거됨
 * - 불변 객체
 */

const MAX_NAME_LENGTH = 100;

export class AggregateName {
    private readonly _value: string;

    constructor(value: string) {
        const trimmedValue = value.trim();

        if (trimmedValue.length === 0) {
            throw new DomainError('Aggregate name cannot be empty');
        }

        if (trimmedValue.length > MAX_NAME_LENGTH) {
            throw new DomainError(`Aggregate name too long (max ${MAX_NAME_LENGTH} characters)`);
        }

        this._value = trimmedValue;
        Object.freeze(this);
    }

    get value(): string {
        return this._value;
    }

    isEmpty(): boolean {
        return this._value.length === 0;
    }

    get length(): number {
        return this._value.length;
    }

    equals(other: AggregateName): boolean {
        if (!(other instanceof AggregateName)) {
            return false;
        }
        return this._value === other._value;
    }

    toJSON(): string {
        return this._value;
    }

    toString(): string {
        return this._value;
    }

    static fromJSON(json: string): AggregateName {
        return new AggregateName(json);
    }
}

export const AGGREGATE_NAME_CONSTANTS = {
    MAX_LENGTH: MAX_NAME_LENGTH,
} as const;