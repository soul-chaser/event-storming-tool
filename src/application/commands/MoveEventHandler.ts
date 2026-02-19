import { MoveEventCommand } from './MoveEventCommand';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { BoardId } from '@domain/value-objects/BoardId';
import { EventId } from '@domain/value-objects/EventId';
import { Position } from '@domain/value-objects/Position';

export class MoveEventHandler {
    constructor(private readonly repository: InMemoryEventRepository) {}

    async handle(command: MoveEventCommand): Promise<void> {
        const boardId = new BoardId(command.boardId);
        const board = await this.repository.load(boardId);

        const eventId = new EventId(command.eventId);
        const newPosition = new Position(command.newX, command.newY);

        board.moveEvent(eventId, newPosition);

        await this.repository.save(board);
    }
}