import { AggregateId } from '../value-objects/AggregateId.js';
import { AggregateName } from '../value-objects/AggregateName.js';
import { Event } from './Event.js';
import { EventId } from '../value-objects/EventId.js';
import { Position } from '../value-objects/Position.js';
import { DomainError } from '../../shared/errors/DomainError.js';

/**
 * Aggregate Entity
 *
 * Event Storming에서 관련된 이벤트들의 집합을 나타내는 엔티티입니다.
 *
 * 특징:
 * - ID로 식별됨 (Entity)
 * - Event 컬렉션 관리
 * - 근접도 기반 이벤트 그룹화
 * - 경계(Bounds) 및 중심점 계산
 * - 비즈니스 규칙: 최대 거리 제한
 */

// 도메인 상수: Aggregate 내 이벤트 간 최대 거리 (픽셀)
const MAX_EVENT_DISTANCE = 500;

// 경계 패딩 (픽셀)
const BOUNDS_PADDING = 50;

export interface AggregateProps {
    id: AggregateId;
    name: AggregateName;
    events: Event[];
    createdAt?: Date;
    lastModified?: Date;
}

export interface CreateAggregateProps {
    name: AggregateName;
    events: Event[];
}

export interface AggregateBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
}

export interface AggregateJSON {
    id: string;
    name: string;
    eventIds: string[];
    createdAt: string;
    lastModified: string;
}

export class Aggregate {
    private readonly _id: AggregateId;
    private _name: AggregateName;
    private _events: Event[];
    private readonly _createdAt: Date;
    private _lastModified: Date;

    constructor(props: AggregateProps) {
        this._id = props.id;
        this._name = props.name;
        this._events = [...props.events]; // 배열 복사로 불변성 보장
        this._createdAt = props.createdAt || new Date();
        this._lastModified = props.lastModified || new Date();
    }

    /**
     * Aggregate ID getter (불변)
     */
    get id(): AggregateId {
        return this._id;
    }

    /**
     * Aggregate 이름 getter
     */
    get name(): AggregateName {
        return this._name;
    }

    /**
     * 포함된 이벤트 목록 getter
     *
     * 불변성 보장을 위해 배열 복사본 반환
     */
    get events(): Event[] {
        return [...this._events];
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
     * Aggregate에 이벤트를 추가합니다.
     *
     * 비즈니스 규칙:
     * - 중복된 이벤트는 추가할 수 없음
     * - Aggregate 중심에서 너무 멀리 떨어진 이벤트는 추가할 수 없음
     *
     * @param event - 추가할 이벤트
     * @throws DomainError - 중복되거나 너무 멀리 떨어진 경우
     */
    addEvent(event: Event): void {
        // 비즈니스 규칙 검증: 중복 체크
        if (this.containsEvent(event.id)) {
            throw new DomainError('Event already exists in this aggregate');
        }

        // 비즈니스 규칙 검증: 거리 체크
        if (!this.canAddEvent(event)) {
            throw new DomainError('Event too far from aggregate');
        }

        this._events.push(event);
        this._lastModified = new Date();
    }

    /**
     * Aggregate에서 이벤트를 제거합니다.
     *
     * @param eventId - 제거할 이벤트의 ID
     * @throws DomainError - 이벤트가 존재하지 않는 경우
     */
    removeEvent(eventId: EventId): void {
        const index = this._events.findIndex(e => e.id.equals(eventId));

        if (index === -1) {
            throw new DomainError('Event not found in this aggregate');
        }

        this._events.splice(index, 1);
        this._lastModified = new Date();
    }

    /**
     * Aggregate의 이름을 변경합니다.
     *
     * @param newName - 새로운 이름
     */
    changeName(newName: AggregateName): void {
        this._name = newName;
        this._lastModified = new Date();
    }

    /**
     * Aggregate가 특정 이벤트를 포함하고 있는지 확인합니다.
     *
     * @param eventId - 확인할 이벤트의 ID
     * @returns 포함하고 있으면 true
     */
    containsEvent(eventId: EventId): boolean {
        return this._events.some(e => e.id.equals(eventId));
    }

    /**
     * 이벤트를 추가할 수 있는지 확인합니다.
     *
     * 비즈니스 규칙:
     * - 빈 Aggregate는 항상 추가 가능
     * - Aggregate 중심에서 MAX_EVENT_DISTANCE 이내여야 함
     *
     * @param event - 확인할 이벤트
     * @returns 추가 가능하면 true
     */
    private canAddEvent(event: Event): boolean {
        // 빈 Aggregate는 항상 추가 가능
        if (this._events.length === 0) {
            return true;
        }

        const center = this.getCenter();
        if (!center) {
            return true;
        }

        const distance = event.position.distanceTo(center);
        return distance <= MAX_EVENT_DISTANCE;
    }

    /**
     * Aggregate에 포함된 이벤트들의 경계를 계산합니다.
     *
     * @returns 경계 정보 (이벤트가 없으면 undefined)
     */
    getBounds(): AggregateBounds | undefined {
        if (this._events.length === 0) {
            return undefined;
        }

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (const event of this._events) {
            const pos = event.position;
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x);
            minY = Math.min(minY, pos.y);
            maxY = Math.max(maxY, pos.y);
        }

        // 패딩 추가
        return {
            minX: minX - BOUNDS_PADDING,
            maxX: maxX + BOUNDS_PADDING,
            minY: minY - BOUNDS_PADDING,
            maxY: maxY + BOUNDS_PADDING,
            width: (maxX - minX) + (BOUNDS_PADDING * 2),
            height: (maxY - minY) + (BOUNDS_PADDING * 2),
        };
    }

    /**
     * Aggregate의 중심점을 계산합니다.
     *
     * 모든 이벤트 위치의 평균값을 반환합니다.
     *
     * @returns 중심점 Position (이벤트가 없으면 undefined)
     */
    getCenter(): Position | undefined {
        if (this._events.length === 0) {
            return undefined;
        }

        let sumX = 0;
        let sumY = 0;

        for (const event of this._events) {
            sumX += event.position.x;
            sumY += event.position.y;
        }

        const centerX = Math.round(sumX / this._events.length);
        const centerY = Math.round(sumY / this._events.length);

        return new Position(centerX, centerY);
    }

    /**
     * Aggregate가 Command를 포함하고 있는지 확인합니다.
     *
     * @returns Command가 있으면 true
     */
    hasCommands(): boolean {
        return this._events.some(e => e.type.isCommand());
    }

    /**
     * Aggregate가 Domain Event를 포함하고 있는지 확인합니다.
     *
     * @returns Domain Event가 있으면 true
     */
    hasDomainEvents(): boolean {
        return this._events.some(e => e.type.isDomainEvent());
    }

    /**
     * Aggregate에 포함된 이벤트 개수를 반환합니다.
     *
     * @returns 이벤트 개수
     */
    getEventCount(): number {
        return this._events.length;
    }

    /**
     * Entity 동일성 비교
     *
     * @param other - 비교할 다른 Aggregate
     * @returns ID가 같으면 true
     */
    equals(other: Aggregate): boolean {
        if (!(other instanceof Aggregate)) {
            return false;
        }
        return this._id.equals(other._id);
    }

    /**
     * JSON 직렬화
     *
     * @returns Aggregate의 JSON 표현
     */
    toJSON(): AggregateJSON {
        return {
            id: this._id.value,
            name: this._name.value,
            eventIds: this._events.map(e => e.id.value),
            createdAt: this._createdAt.toISOString(),
            lastModified: this._lastModified.toISOString(),
        };
    }

    /**
     * 문자열 표현
     *
     * @returns Aggregate의 문자열 표현
     */
    toString(): string {
        return `Aggregate(${this._id.value}, ${this._name.value}, ${this._events.length} events)`;
    }

    /**
     * 정적 팩토리 메서드 - 새로운 Aggregate 생성
     *
     * ID를 자동으로 생성합니다.
     *
     * @param props - Aggregate 생성에 필요한 속성
     * @returns 새로운 Aggregate 인스턴스
     */
    static create(props: CreateAggregateProps): Aggregate {
        return new Aggregate({
            id: AggregateId.generate(),
            name: props.name,
            events: props.events,
        });
    }

    /**
     * 정적 팩토리 메서드 - 이벤트 배열에서 Aggregate 생성
     *
     * @param name - Aggregate 이름
     * @param events - 포함할 이벤트 배열
     * @returns 새로운 Aggregate 인스턴스
     */
    static fromEvents(name: AggregateName, events: Event[]): Aggregate {
        return Aggregate.create({ name, events });
    }
}

/**
 * Aggregate 상수 export
 */
export const AGGREGATE_CONSTANTS = {
    MAX_EVENT_DISTANCE,
    BOUNDS_PADDING,
} as const;