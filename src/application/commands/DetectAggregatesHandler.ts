import { DetectAggregatesCommand } from './DetectAggregatesCommand';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { BoardId } from '@domain/value-objects/BoardId';

export class DetectAggregatesHandler {
    constructor(private readonly repository: InMemoryEventRepository) {}

    async handle(command: DetectAggregatesCommand): Promise<void> {
        const boardId = new BoardId(command.boardId);
        const board = await this.repository.load(boardId);

        board.detectAggregates();

        await this.repository.save(board);
    }
}