import { BoardId } from '../value-objects/BoardId';
import { Event } from '../entities/Event';
import { EventId } from '../value-objects/EventId';
import { EventName } from '../value-objects/EventName';
import { EventType } from '../value-objects/EventType';
import { Position } from '../value-objects/Position';
import { Aggregate } from '../entities/Aggregate';
import { AggregateName } from '../value-objects/AggregateName';
import { DomainError } from '@shared/errors/DomainError';
import { getEventCardDimensions } from '@shared/utils/eventCardLayout';

/**
 * EventStormingBoard Domain Service
 *
 * Event Storming 보드를 관리하는 도메인 서비스입니다.
 *
 * 책임:
 * - Event 추가/제거/이동 관리
 * - 위치 겹침 검증
 * - Aggregate 자동 감지
 * - Event Storming 흐름 검증
 * - 이벤트 조회 및 필터링
 */

// 도메인 상수
const MIN_EVENT_DISTANCE = 50; // 이벤트 간 최소 거리 (겹침 판단)
const CLUSTERING_DISTANCE = 300; // Aggregate 클러스터링 거리

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export class EventStormingBoard {
    private readonly _id: BoardId;
    private _events: Map<string, Event>;
    private _aggregates: Aggregate[];

    constructor(id: BoardId, events: Event[] = [], aggregates: Aggregate[] = []) {
        this._id = id;
        this._events = new Map();
        events.forEach(e => this._events.set(e.id.value, e));
        this._aggregates = [...aggregates];
    }

    /**
     * Board ID getter (불변)
     */
    get id(): BoardId {
        return this._id;
    }

    /**
     * 보드에 이벤트를 추가합니다.
     *
     * 비즈니스 규칙:
     * - 중복된 이벤트는 추가할 수 없음
     * - 다른 이벤트와 위치가 겹치면 추가할 수 없음
     *
     * @param event - 추가할 이벤트
     * @throws DomainError - 규칙 위반 시
     */
    addEvent(event: Event): void {
        // 비즈니스 규칙 검증: 중복 체크
        if (this._events.has(event.id.value)) {
            throw new DomainError('Event already exists on board');
        }

        // 비즈니스 규칙 검증: 위치 겹침 체크
        if (this.hasOverlappingEvent(event.position, undefined, event.name.value)) {
            throw new DomainError('Event position overlaps with existing event');
        }

        this._events.set(event.id.value, event);
    }

    /**
     * 보드에서 이벤트를 제거합니다.
     *
     * @param eventId - 제거할 이벤트의 ID
     * @throws DomainError - 이벤트가 존재하지 않는 경우
     */
    removeEvent(eventId: EventId): void {
        if (!this._events.has(eventId.value)) {
            throw new DomainError('Event not found on board');
        }

        this._events.delete(eventId.value);

        // Aggregate에서도 제거
        this._aggregates = this._aggregates.map(agg => {
            if (agg.containsEvent(eventId)) {
                try {
                    agg.removeEvent(eventId);
                } catch (e) {
                    // 이미 제거됨
                }
            }
            return agg;
        }).filter(agg => agg.getEventCount() > 0); // 빈 Aggregate 제거
    }

    /**
     * 이벤트를 새로운 위치로 이동합니다.
     *
     * 비즈니스 규칙:
     * - 다른 이벤트와 겹치지 않아야 함
     * - 보드 경계 내에 있어야 함
     *
     * @param eventId - 이동할 이벤트의 ID
     * @param newPosition - 새로운 위치
     * @throws DomainError - 규칙 위반 시
     */
    moveEvent(eventId: EventId, newPosition: Position): void {
        const event = this._events.get(eventId.value);
        if (!event) {
            throw new DomainError('Event not found on board');
        }

        // 비즈니스 규칙 검증: 위치 겹침 (자기 자신 제외)
        if (this.hasOverlappingEvent(newPosition, eventId, event.name.value)) {
            throw new DomainError('Event position overlaps with existing event');
        }

        // Event의 moveTo 메서드 호출 (보드 경계 검증 포함)
        event.moveTo(newPosition);
    }

    /**
     * 이벤트의 이름을 변경합니다.
     *
     * @param eventId - 이름을 변경할 이벤트의 ID
     * @param newName - 새로운 이벤트 이름
     * @throws DomainError - 이벤트가 존재하지 않는 경우
     */
    renameEvent(eventId: EventId, newName: EventName): void {
        const event = this._events.get(eventId.value);
        if (!event) {
            throw new DomainError('Event not found on board');
        }

        event.changeName(newName);
    }

    /**
     * ID로 이벤트를 조회합니다.
     *
     * @param eventId - 조회할 이벤트의 ID
     * @returns Event 또는 undefined
     */
    getEvent(eventId: EventId): Event | undefined {
        return this._events.get(eventId.value);
    }

    /**
     * 모든 이벤트를 반환합니다.
     *
     * @returns 이벤트 배열
     */
    getAllEvents(): Event[] {
        return Array.from(this._events.values());
    }

    /**
     * 모든 Aggregate를 반환합니다.
     *
     * @returns Aggregate 배열
     */
    getAllAggregates(): Aggregate[] {
        return [...this._aggregates];
    }

    /**
     * 이벤트 개수를 반환합니다.
     *
     * @returns 이벤트 개수
     */
    getEventCount(): number {
        return this._events.size;
    }

    /**
     * 특정 위치에 겹치는 이벤트가 있는지 확인합니다.
     *
     * @param position - 확인할 위치
     * @param excludeEventId - 제외할 이벤트 ID (선택)
     * @returns 겹치는 이벤트가 있으면 true
     */
    hasOverlappingEvent(position: Position, excludeEventId?: EventId, candidateName = 'New Event'): boolean {
        const candidateBounds = this.getBounds(position, candidateName);

        for (const event of this._events.values()) {
            // 제외할 이벤트는 건너뜀
            if (excludeEventId && event.id.equals(excludeEventId)) {
                continue;
            }

            const existingBounds = this.getBounds(event.position, event.name.value);

            const isSeparated =
                candidateBounds.right <= existingBounds.left ||
                candidateBounds.left >= existingBounds.right ||
                candidateBounds.bottom <= existingBounds.top ||
                candidateBounds.top >= existingBounds.bottom;

            if (!isSeparated) {
                return true;
            }
        }
        return false;
    }

    private getBounds(position: Position, eventName: string): {
        left: number;
        top: number;
        right: number;
        bottom: number;
    } {
        const dimensions = getEventCardDimensions(eventName);
        return {
            left: position.x,
            top: position.y,
            right: position.x + dimensions.width,
            bottom: position.y + dimensions.height,
        };
    }

    /**
     * 근접한 이벤트들을 Aggregate로 자동 감지합니다.
     *
     * 클러스터링 알고리즘:
     * - DBSCAN 변형 사용
     * - CLUSTERING_DISTANCE 이내의 이벤트들을 그룹화
     *
     * @returns 감지된 Aggregate 배열
     */
    detectAggregates(): Aggregate[] {
        const events = this.getAllEvents();
        if (events.length === 0) {
            this._aggregates = [];
            return [];
        }

        const visited = new Set<string>();
        const clusters: Event[][] = [];

        for (const event of events) {
            if (visited.has(event.id.value)) {
                continue;
            }

            const cluster = this.findCluster(event, events, visited);
            if (cluster.length > 0) {
                clusters.push(cluster);
            }
        }

        // Aggregate 생성
        this._aggregates = clusters.map((cluster, index) => {
            const name = new AggregateName(`Aggregate ${index + 1}`);
            return Aggregate.create({ name, events: cluster });
        });

        return this._aggregates;
    }

    /**
     * 특정 이벤트를 시작으로 클러스터를 찾습니다.
     *
     * @param startEvent - 시작 이벤트
     * @param allEvents - 모든 이벤트 목록
     * @param visited - 방문한 이벤트 ID Set
     * @returns 클러스터에 속한 이벤트 배열
     */
    private findCluster(
        startEvent: Event,
        allEvents: Event[],
        visited: Set<string>
    ): Event[] {
        const cluster: Event[] = [];
        const queue: Event[] = [startEvent];

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (visited.has(current.id.value)) {
                continue;
            }

            visited.add(current.id.value);
            cluster.push(current);

            // 근접한 이웃 찾기
            for (const neighbor of allEvents) {
                if (visited.has(neighbor.id.value)) {
                    continue;
                }

                const distance = current.position.distanceTo(neighbor.position);
                if (distance <= CLUSTERING_DISTANCE) {
                    queue.push(neighbor);
                }
            }
        }

        return cluster;
    }

    /**
     * Event Storming 흐름을 검증합니다.
     *
     * 검증 규칙:
     * - Command 다음에는 반드시 Domain Event가 와야 함
     * - 시간 순서 (x 좌표 순서) 확인
     *
     * @returns 검증 결과
     */
    validateFlow(): ValidationResult {
        const errors: string[] = [];
        const events = this.getEventsSortedByPosition();

        for (let i = 0; i < events.length; i++) {
            const current = events[i];

            // Command 검증
            if (current.type.isCommand()) {
                const next = events[i + 1];
                if (!next) {
                    errors.push(`Command "${current.name.value}" must be followed by an event`);
                } else if (!next.type.isDomainEvent()) {
                    errors.push(
                        `Command "${current.name.value}" must be followed by a domain event, but found ${next.type.value}`
                    );
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * 특정 타입의 이벤트만 필터링합니다.
     *
     * @param type - 필터링할 이벤트 타입
     * @returns 해당 타입의 이벤트 배열
     */
    getEventsByType(type: EventType): Event[] {
        return this.getAllEvents().filter(e => e.type.equals(type));
    }

    /**
     * 이벤트들을 x 좌표 순으로 정렬하여 반환합니다.
     *
     * @returns 정렬된 이벤트 배열
     */
    getEventsSortedByPosition(): Event[] {
        return this.getAllEvents().sort((a, b) => a.position.x - b.position.x);
    }

    /**
     * 보드의 모든 이벤트와 Aggregate를 제거합니다.
     */
    clear(): void {
        this._events.clear();
        this._aggregates = [];
    }

    /**
     * 정적 팩토리 메서드 - 새로운 보드 생성
     *
     * @param id - 보드 ID
     * @returns 새로운 EventStormingBoard 인스턴스
     */
    static create(id: BoardId): EventStormingBoard {
        return new EventStormingBoard(id);
    }
}

/**
 * EventStormingBoard 상수 export
 */
export const BOARD_CONSTANTS = {
    MIN_EVENT_DISTANCE,
    CLUSTERING_DISTANCE,
} as const;
