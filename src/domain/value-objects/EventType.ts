import { DomainError } from '../../shared/errors/DomainError.js';

/**
 * EventType Value Object
 *
 * Event Storming에서 사용하는 이벤트 타입을 나타내는 불변 값 객체입니다.
 *
 * Event Storming 표준 타입:
 * - domain-event: 도메인 이벤트 (오렌지색)
 * - command: 명령 (하늘색)
 * - policy: 정책/규칙 (보라색)
 * - aggregate: 집합체 (노란색)
 * - external-system: 외부 시스템 (분홍색)
 * - read-model: 읽기 모델 (초록색)
 *
 * 비즈니스 규칙:
 * - 정의된 타입만 허용
 * - 대소문자 구분
 * - 불변 객체
 */

// 허용되는 이벤트 타입 정의
const VALID_EVENT_TYPES = [
    'domain-event',
    'command',
    'policy',
    'external-system',
    'aggregate',
    'read-model',
] as const;

type ValidEventType = typeof VALID_EVENT_TYPES[number];

// Event Storming 표준 색상 매핑
const COLOR_MAP: Record<ValidEventType, string> = {
    'domain-event': '#FFA500',    // 오렌지
    'command': '#87CEEB',          // 하늘색
    'aggregate': '#FFD700',        // 노란색
    'policy': '#DDA0DD',           // 보라색
    'external-system': '#FFB6C1',  // 분홍색
    'read-model': '#90EE90',       // 초록색
};

export class EventType {
    private readonly _value: ValidEventType;

    constructor(value: string) {
        // 비즈니스 규칙 검증: 유효한 타입만 허용
        if (!this.isValidType(value)) {
            throw new DomainError(`Invalid event type: ${value}`);
        }

        this._value = value as ValidEventType;

        // 불변성 보장
        Object.freeze(this);
    }

    /**
     * 타입 값 getter
     */
    get value(): string {
        return this._value;
    }

    /**
     * 이벤트 타입에 맞는 색상을 반환합니다.
     *
     * Event Storming 표준 색상:
     * - domain-event: 오렌지 (#FFA500)
     * - command: 하늘색 (#87CEEB)
     * - aggregate: 노란색 (#FFD700)
     * - policy: 보라색 (#DDA0DD)
     * - external-system: 분홍색 (#FFB6C1)
     * - read-model: 초록색 (#90EE90)
     *
     * @returns 색상 코드 (hex)
     */
    getColor(): string {
        return COLOR_MAP[this._value];
    }

    /**
     * Domain Event 타입인지 확인합니다.
     *
     * @returns domain-event이면 true
     */
    isDomainEvent(): boolean {
        return this._value === 'domain-event';
    }

    /**
     * Command 타입인지 확인합니다.
     *
     * @returns command이면 true
     */
    isCommand(): boolean {
        return this._value === 'command';
    }

    /**
     * Policy 타입인지 확인합니다.
     *
     * @returns policy이면 true
     */
    isPolicy(): boolean {
        return this._value === 'policy';
    }

    /**
     * Aggregate 타입인지 확인합니다.
     *
     * @returns aggregate이면 true
     */
    isAggregate(): boolean {
        return this._value === 'aggregate';
    }

    /**
     * External System 타입인지 확인합니다.
     *
     * @returns external-system이면 true
     */
    isExternalSystem(): boolean {
        return this._value === 'external-system';
    }

    /**
     * Read Model 타입인지 확인합니다.
     *
     * @returns read-model이면 true
     */
    isReadModel(): boolean {
        return this._value === 'read-model';
    }

    /**
     * Value Object 동등성 비교
     *
     * @param other - 비교할 다른 EventType
     * @returns 동등하면 true
     */
    equals(other: EventType): boolean {
        if (!(other instanceof EventType)) {
            return false;
        }
        return this._value === other._value;
    }

    /**
     * 주어진 값이 유효한 이벤트 타입인지 확인합니다.
     *
     * @param value - 확인할 값
     * @returns 유효한 타입이면 true
     */
    private isValidType(value: string): value is ValidEventType {
        return VALID_EVENT_TYPES.includes(value as ValidEventType);
    }

    /**
     * JSON 직렬화
     *
     * @returns EventType의 JSON 표현
     */
    toJSON(): string {
        return this._value;
    }

    /**
     * 문자열 표현
     *
     * @returns EventType의 문자열 표현
     */
    toString(): string {
        return this._value;
    }

    /**
     * 정적 팩토리 메서드 - JSON에서 EventType 생성
     *
     * @param json - 문자열 값
     * @returns EventType 인스턴스
     */
    static fromJSON(json: string): EventType {
        return new EventType(json);
    }

    /**
     * 모든 유효한 이벤트 타입 목록을 반환합니다.
     *
     * @returns 유효한 타입 배열
     */
    static getValidTypes(): readonly string[] {
        return VALID_EVENT_TYPES;
    }
}

/**
 * EventType 상수 export
 */
export const EVENT_TYPE_CONSTANTS = {
    VALID_TYPES: VALID_EVENT_TYPES,
    COLORS: COLOR_MAP,
} as const;