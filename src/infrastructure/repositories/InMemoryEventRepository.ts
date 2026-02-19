import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';

/**
 * InMemoryEventRepository
 *
 * 메모리 기반 EventStormingBoard 저장소입니다.
 */
export class InMemoryEventRepository {
    private boards: Map<string, EventStormingBoard> = new Map();

    async save(board: EventStormingBoard): Promise<void> {
        this.boards.set(board.id.value, board);
    }

    async load(boardId: BoardId): Promise<EventStormingBoard> {
        const board = this.boards.get(boardId.value);
        if (!board) {
            throw new Error(`Board not found: ${boardId.value}`);
        }
        return board;
    }

    async exists(boardId: BoardId): Promise<boolean> {
        return this.boards.has(boardId.value);
    }

    async delete(boardId: BoardId): Promise<void> {
        this.boards.delete(boardId.value);
    }

    clear(): void {
        this.boards.clear();
    }
}