import { describe, it, expect, beforeEach } from 'vitest';
import { MoveEventHandler } from '@application/commands/MoveEventHandler';
import { MoveEventCommand } from '@application/commands/MoveEventCommand';
import { CreateEventHandler } from '@application/commands/CreateEventHandler';
import { CreateEventCommand } from '@application/commands/CreateEventCommand';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';
import { DomainError } from '@shared/errors/DomainError';

describe('MoveEventHandler', () => {
    let handler: MoveEventHandler;
    let createHandler: CreateEventHandler;
    let repository: InMemoryEventRepository;
    let boardId: string;
    let eventId: string;

    beforeEach(async () => {
        repository = new InMemoryEventRepository();
        handler = new MoveEventHandler(repository);
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

    it('이벤트를 새로운 위치로 이동할 수 있다', async () => {
        const command = new MoveEventCommand(boardId, eventId, 300, 400);

        await handler.handle(command);

        const board = await repository.load(new BoardId(boardId));
        const event = board.getEvent(board.getAllEvents()[0].id);
        expect(event?.position.x).toBe(300);
        expect(event?.position.y).toBe(400);
    });

    it('보드 경계를 벗어나는 위치로는 이동할 수 없다', async () => {
        const command = new MoveEventCommand(boardId, eventId, 10001, 200);

        await expect(handler.handle(command)).rejects.toThrow(DomainError);
    });

    it('다른 이벤트와 겹치는 위치로는 이동할 수 없다', async () => {
        // 두 번째 이벤트 추가
        const createCmd = new CreateEventCommand(
            boardId,
            '이벤트2',
            'domain-event',
            300,
            200
        );
        await createHandler.handle(createCmd);

        // 첫 번째 이벤트를 두 번째 이벤트 근처로 이동 시도
        const command = new MoveEventCommand(boardId, eventId, 305, 205);

        await expect(handler.handle(command)).rejects.toThrow(DomainError);
    });

    it('존재하지 않는 이벤트는 이동할 수 없다', async () => {
        const command = new MoveEventCommand(
            boardId,
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            300,
            400
        );

        await expect(handler.handle(command)).rejects.toThrow(DomainError);
    });

    it('존재하지 않는 보드에서는 이동할 수 없다', async () => {
        const command = new MoveEventCommand(
            'non-existent-board',
            eventId,
            300,
            400
        );

        await expect(handler.handle(command)).rejects.toThrow();
    });
});