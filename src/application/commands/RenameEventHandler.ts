import { RenameEventCommand } from './RenameEventCommand';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { BoardId } from '@domain/value-objects/BoardId';
import { EventId } from '@domain/value-objects/EventId';
import { EventName } from '@domain/value-objects/EventName';

export class RenameEventHandler {
    constructor(private readonly repository: InMemoryEventRepository) {}

    async handle(command: RenameEventCommand): Promise<void> {
        const boardId = new BoardId(command.boardId);
        const board = await this.repository.load(boardId);

        const eventId = new EventId(command.eventId);
        const newName = new EventName(command.newName);

        board.renameEvent(eventId, newName);

        await this.repository.save(board);
    }
}
