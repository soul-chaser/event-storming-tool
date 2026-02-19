import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteEventHandler } from '@application/commands/DeleteEventHandler';
import { DeleteEventCommand } from '@application/commands/DeleteEventCommand';
import { CreateEventHandler } from '@application/commands/CreateEventHandler';
import { CreateEventCommand } from '@application/commands/CreateEventCommand';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';
import { DomainError } from '@shared/errors/DomainError';

describe('DeleteEventHandler', () => {
    let handler: DeleteEventHandler;
    let createHandler: CreateEventHandler;
    let repository: InMemoryEventRepository;
    let boardId: string;
    let eventId: string;

    beforeEach(async () => {
        repository = new InMemoryEventRepository();
        handler = new DeleteEventHandler(repository);
        createHandler = new CreateEventHandler(repository);

        const board = EventStormingBoard.create(BoardId.generate());
        boardId = board.id.value;
        await repository.save(board);

        // 테스트용 이벤트 생성
        const createCmd = new CreateEventCommand(
            boardId,
            '사용자 등록됨',
            'domain-event',
            100,
            200
        );
        await createHandler.handle(createCmd);

        const updatedBoard = await repository.load(new BoardId(boardId));
        eventId = updatedBoard.getAllEvents()[0].id.value;
    });

    it('이벤트를 삭제할 수 있다', async () => {
        const command = new DeleteEventCommand(boardId, eventId);

        await handler.handle(command);

        const board = await repository.load(new BoardId(boardId));
        expect(board.getEventCount()).toBe(0);
    });

    it('여러 이벤트 중 하나만 삭제할 수 있다', async () => {
        // 두 번째 이벤트 추가
        const createCmd = new CreateEventCommand(
            boardId,
            '이벤트2',
            'domain-event',
            300,
            200
        );
        await createHandler.handle(createCmd);

        const command = new DeleteEventCommand(boardId, eventId);
        await handler.handle(command);

        const board = await repository.load(new BoardId(boardId));
        expect(board.getEventCount()).toBe(1);
    });

    it('존재하지 않는 이벤트는 삭제할 수 없다', async () => {
        const command = new DeleteEventCommand(
            boardId,
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
        );

        await expect(handler.handle(command)).rejects.toThrow(DomainError);
    });

    it('존재하지 않는 보드에서는 삭제할 수 없다', async () => {
        const command = new DeleteEventCommand('non-existent-board', eventId);

        await expect(handler.handle(command)).rejects.toThrow();
    });

    it('이미 삭제된 이벤트를 다시 삭제할 수 없다', async () => {
        const command = new DeleteEventCommand(boardId, eventId);
        await handler.handle(command);

        await expect(handler.handle(command)).rejects.toThrow(DomainError);
    });
});