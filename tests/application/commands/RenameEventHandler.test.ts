import { describe, it, expect, beforeEach } from 'vitest';
import { RenameEventHandler } from '@application/commands/RenameEventHandler';
import { RenameEventCommand } from '@application/commands/RenameEventCommand';
import { CreateEventHandler } from '@application/commands/CreateEventHandler';
import { CreateEventCommand } from '@application/commands/CreateEventCommand';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';
import { DomainError } from '@shared/errors/DomainError';

describe('RenameEventHandler', () => {
    let handler: RenameEventHandler;
    let createHandler: CreateEventHandler;
    let repository: InMemoryEventRepository;
    let boardId: string;
    let eventId: string;

    beforeEach(async () => {
        repository = new InMemoryEventRepository();
        handler = new RenameEventHandler(repository);
        createHandler = new CreateEventHandler(repository);

        const board = EventStormingBoard.create(BoardId.generate());
        boardId = board.id.value;
        await repository.save(board);

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

    it('이벤트 이름을 변경할 수 있다', async () => {
        const command = new RenameEventCommand(boardId, eventId, '회원 가입 완료');

        await handler.handle(command);

        const board = await repository.load(new BoardId(boardId));
        const event = board.getEvent(board.getAllEvents()[0].id);
        expect(event?.name.value).toBe('회원 가입 완료');
    });

    it('빈 이름으로는 변경할 수 없다', async () => {
        const command = new RenameEventCommand(boardId, eventId, '   ');

        await expect(handler.handle(command)).rejects.toThrow(DomainError);
    });

    it('존재하지 않는 이벤트 이름은 변경할 수 없다', async () => {
        const command = new RenameEventCommand(
            boardId,
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            '새 이름'
        );

        await expect(handler.handle(command)).rejects.toThrow(DomainError);
    });
});
