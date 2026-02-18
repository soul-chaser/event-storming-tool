import { EventId } from '../value-objects/EventId';
import { EventName } from '../value-objects/EventName';
import { EventType } from '../value-objects/EventType';
import { Position } from '../value-objects/Position';
import { DomainError } from '../../shared/errors/DomainError';

/**
 * Event Entity
 *
 * Event Storming에서 이벤트 카드를 나타내는 엔티티입니다.
 *
 * 특징:
 * - ID로 식별됨 (Entity의 핵심)
 * - 상태 변경 가능 (위치, 이름, 타입, 설명)
 * - 비즈니스 규칙 검증
 * - 타임스탬프 추적 (생성일시, 수정일시)
 */

export interface EventProps {
    id: EventId;
    name: EventName;
    type: EventType;
    position: Position;
    description?: string;
    createdAt?: Date;
    lastModified?: Date;
}

export interface CreateEventProps {
    name: EventName;
    type: EventType;
    position: Position;
    description?: string;
}

export interface EventJSON {
    id: string;
    name: string;
    type: string;
    position: { x: number; y: number };
    description?: string;
    createdAt: string;
    lastModified: string;
}

export class Event {
    private readonly _id: EventId;
    private _name: EventName;
    private _type: EventType;
    private _position: Position;
    private _description?: string;
    private readonly _createdAt: Date;
    private _lastModified: Date;

    constructor(props: EventProps) {
        this._id = props.id;
        this._name = props.name;
        this._type = props.type;
        this._position = props.position;
        this._description = props.description;
        this._createdAt = props.createdAt || new Date();
        this._lastModified = props.lastModified || new Date();
    }

    /**
     * Event ID getter (불변)
     */
    get id(): EventId {
        return this._id;
    }

    /**
     * Event 이름 getter
     */
    get name(): EventName {
        return this._name;
    }

    /**
     * Event 타입 getter
     */
    get type(): EventType {
        return this._type;
    }

    /**
     * Event 위치 getter
     */
    get position(): Position {
        return this._position;
    }

    /**
     * Event 설명 getter
     */
    get description(): string | undefined {
        return this._description;
    }

    /**
     * 생성 일시 getter (불변)
     */
    get createdAt(): Date {
        return this._createdAt;
    }

    /**
     * 마지막 수정 일시 getter
     */
    get lastModified(): Date {
        return this._lastModified;
    }

    /**
     * Event를 새로운 위치로 이동합니다.
     *
     * 비즈니스 규칙:
     * - 새 위치는 보드 경계 내에 있어야 함
     *
     * @param newPosition - 새로운 위치
     * @throws DomainError - 보드 경계를 벗어난 경우
     */
    moveTo(newPosition: Position): void {
        // 비즈니스 규칙 검증
        if (!newPosition.isWithinBounds()) {
            throw new DomainError('Position out of bounds');
        }

        this._position = newPosition;
        this._lastModified = new Date();
    }

    /**
     * Event의 이름을 변경합니다.
     *
     * @param newName - 새로운 이름
     */
    changeName(newName: EventName): void {
        this._name = newName;
        this._lastModified = new Date();
    }

    /**
     * Event의 타입을 변경합니다.
     *
     * @param newType - 새로운 타입
     */
    changeType(newType: EventType): void {
        this._type = newType;
        this._lastModified = new Date();
    }

    /**
     * Event의 설명을 업데이트합니다.
     *
     * @param description - 새로운 설명 (undefined면 제거)
     */
    updateDescription(description?: string): void {
        this._description = description;
        this._lastModified = new Date();
    }

    /**
     * Event의 색상을 반환합니다.
     *
     * EventType에서 위임받습니다.
     *
     * @returns 색상 코드 (hex)
     */
    getColor(): string {
        return this._type.getColor();
    }

    /**
     * Entity 동일성 비교
     *
     * Entity는 ID로 식별됩니다.
     * 다른 속성이 달라도 ID가 같으면 동일한 Entity입니다.
     *
     * @param other - 비교할 다른 Event
     * @returns ID가 같으면 true
     */
    equals(other: Event): boolean {
        if (!(other instanceof Event)) {
            return false;
        }
        return this._id.equals(other._id);
    }

    /**
     * JSON 직렬화
     *
     * @returns Event의 JSON 표현
     */
    toJSON(): EventJSON {
        return {
            id: this._id.value,
            name: this._name.value,
            type: this._type.value,
            position: this._position.toJSON(),
            description: this._description,
            createdAt: this._createdAt.toISOString(),
            lastModified: this._lastModified.toISOString(),
        };
    }

    /**
     * 문자열 표현
     *
     * @returns Event의 문자열 표현
     */
    toString(): string {
        return `Event(${this._id.value}, ${this._name.value}, ${this._type.value})`;
    }

    /**
     * 정적 팩토리 메서드 - 새로운 Event 생성
     *
     * ID를 자동으로 생성합니다.
     *
     * @param props - Event 생성에 필요한 속성
     * @returns 새로운 Event 인스턴스
     *
     * @example
     * const event = Event.create({
     *   name: new EventName('사용자 등록됨'),
     *   type: new EventType('domain-event'),
     *   position: new Position(100, 200),
     * });
     */
    static create(props: CreateEventProps): Event {
        return new Event({
            id: EventId.generate(),
            name: props.name,
            type: props.type,
            position: props.position,
            description: props.description,
        });
    }

    /**
     * 정적 팩토리 메서드 - JSON에서 Event 복원
     *
     * @param json - Event의 JSON 표현
     * @returns Event 인스턴스
     */
    static fromJSON(json: EventJSON): Event {
        return new Event({
            id: new EventId(json.id),
            name: new EventName(json.name),
            type: new EventType(json.type),
            position: Position.fromJSON(json.position),
            description: json.description,
            createdAt: new Date(json.createdAt),
            lastModified: new Date(json.lastModified),
        });
    }
}