/**
 * GetBoardStateQuery
 */
export class GetBoardStateQuery {
    constructor(public readonly boardId: string) {}
}

/**
 * BoardStateDTO
 */
export interface BoardStateDTO {
    id: string;
    events: EventDTO[];
    aggregates: AggregateDTO[];
}

export interface EventDTO {
    id: string;
    name: string;
    type: string;
    position: { x: number; y: number };
    description?: string;
    color: string;
    createdAt: string;
    lastModified: string;
}

export interface AggregateDTO {
    id: string;
    name: string;
    eventIds: string[];
    bounds?: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
}