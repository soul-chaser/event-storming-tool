import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateEventDescriptionHandler } from '@application/commands/UpdateEventDescriptionHandler';
import { UpdateEventDescriptionCommand } from '@application/commands/UpdateEventDescriptionCommand';
import { CreateEventHandler } from '@application/commands/CreateEventHandler';
import { CreateEventCommand } from '@application/commands/CreateEventCommand';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';
import { DomainError } from '@shared/errors/DomainError';

describe('UpdateEventDescriptionHandler', () => {
    let handler: UpdateEventDescriptionHandler;
    let createHandler: CreateEventHandler;
    let repository: InMemoryEventRepository;
    let boardId: string;
    let eventId: string;

    beforeEach(async () => {
        repository = new InMemoryEventRepository();
        handler = new UpdateEventDescriptionHandler(repository);
        createHandler = new CreateEventHandler(repository);

        const board = EventStormingBoard.create(BoardId.generate());
        boardId = board.id.value;
        await repository.save(board);

        await createHandler.handle(new CreateEventCommand(
            boardId,
            '사용자 등록됨',
            'domain-event',
            100,
            200,
            '기존 설명'
        ));

        const updatedBoard = await repository.load(new BoardId(boardId));
        eventId = updatedBoard.getAllEvents()[0].id.value;
    });

    it('이벤트 설명을 변경할 수 있다', async () => {
        const command = new UpdateEventDescriptionCommand(boardId, eventId, '변경된 설명');

        await handler.handle(command);

        const board = await repository.load(new BoardId(boardId));
        const event = board.getAllEvents()[0];
        expect(event.description).toBe('변경된 설명');
    });

    it('빈 설명을 전달하면 설명을 제거한다', async () => {
        const command = new UpdateEventDescriptionCommand(boardId, eventId, '   ');

        await handler.handle(command);

        const board = await repository.load(new BoardId(boardId));
        const event = board.getAllEvents()[0];
        expect(event.description).toBeUndefined();
    });

    it('존재하지 않는 이벤트 설명은 변경할 수 없다', async () => {
        const command = new UpdateEventDescriptionCommand(
            boardId,
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            '설명'
        );

        await expect(handler.handle(command)).rejects.toThrow(DomainError);
    });
});
