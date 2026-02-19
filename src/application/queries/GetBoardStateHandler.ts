import { GetBoardStateQuery, BoardStateDTO, EventDTO, AggregateDTO } from './GetBoardStateQuery';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { BoardId } from '@domain/value-objects/BoardId';
import { Event } from '@domain/entities/Event';
import { Aggregate } from '@domain/entities/Aggregate';

export class GetBoardStateHandler {
    constructor(private readonly repository: InMemoryEventRepository) {}

    async handle(query: GetBoardStateQuery): Promise<BoardStateDTO> {
        const boardId = new BoardId(query.boardId);
        const board = await this.repository.load(boardId);

        return {
            id: board.id.value,
            events: board.getAllEvents().map(e => this.toEventDTO(e)),
            aggregates: board.getAllAggregates().map(a => this.toAggregateDTO(a)),
        };
    }

    private toEventDTO(event: Event): EventDTO {
        return {
            id: event.id.value,
            name: event.name.value,
            type: event.type.value,
            position: { x: event.position.x, y: event.position.y },
            description: event.description,
            color: event.getColor(),
            createdAt: event.createdAt.toISOString(),
            lastModified: event.lastModified.toISOString(),
        };
    }

    private toAggregateDTO(aggregate: Aggregate): AggregateDTO {
        const bounds = aggregate.getBounds();
        return {
            id: aggregate.id.value,
            name: aggregate.name.value,
            eventIds: aggregate.events.map(e => e.id.value),
            bounds: bounds ? {
                minX: bounds.minX,
                maxX: bounds.maxX,
                minY: bounds.minY,
                maxY: bounds.maxY,
            } : undefined,
        };
    }
}