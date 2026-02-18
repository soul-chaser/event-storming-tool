import { DomainError } from '../../shared/errors/DomainError.js';
import { randomUUID } from 'crypto';

/**
 * AggregateId Value Object
 *
 * Aggregate의 고유 식별자를 나타내는 불변 값 객체입니다.
 * UUID v4 형식을 사용합니다.
 */

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AggregateId {
    private readonly _value: string;

    constructor(value: string) {
        const normalizedValue = value.toLowerCase();

        if (!this.isValidUUID(normalizedValue)) {
            throw new DomainError('Invalid UUID format for AggregateId');
        }

        this._value = normalizedValue;
        Object.freeze(this);
    }

    get value(): string {
        return this._value;
    }

    static generate(): AggregateId {
        return new AggregateId(randomUUID());
    }

    equals(other: AggregateId): boolean {
        if (!(other instanceof AggregateId)) {
            return false;
        }
        return this._value === other._value;
    }

    private isValidUUID(value: string): boolean {
        if (!value || typeof value !== 'string') {
            return false;
        }
        return UUID_V4_REGEX.test(value);
    }

    toJSON(): string {
        return this._value;
    }

    toString(): string {
        return this._value;
    }

    static fromJSON(json: string): AggregateId {
        return new AggregateId(json);
    }

    static fromString(value: string): AggregateId {
        return new AggregateId(value);
    }
}