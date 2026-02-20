import { UpdateEventDescriptionCommand } from './UpdateEventDescriptionCommand';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { BoardId } from '@domain/value-objects/BoardId';
import { EventId } from '@domain/value-objects/EventId';

export class UpdateEventDescriptionHandler {
    constructor(private readonly repository: InMemoryEventRepository) {}

    async handle(command: UpdateEventDescriptionCommand): Promise<void> {
        const boardId = new BoardId(command.boardId);
        const board = await this.repository.load(boardId);

        const eventId = new EventId(command.eventId);
        const normalizedDescription = command.description?.trim();

        board.updateEventDescription(eventId, normalizedDescription ? normalizedDescription : undefined);

        await this.repository.save(board);
    }
}
