import { DeleteEventCommand } from './DeleteEventCommand';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { BoardId } from '@domain/value-objects/BoardId';
import { EventId } from '@domain/value-objects/EventId';

export class DeleteEventHandler {
    constructor(private readonly repository: InMemoryEventRepository) {}

    async handle(command: DeleteEventCommand): Promise<void> {
        const boardId = new BoardId(command.boardId);
        const board = await this.repository.load(boardId);

        const eventId = new EventId(command.eventId);
        board.removeEvent(eventId);

        await this.repository.save(board);
    }
}