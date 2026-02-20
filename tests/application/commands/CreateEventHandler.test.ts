import { describe, it, expect, beforeEach } from 'vitest';
import { CreateEventHandler } from '@application/commands/CreateEventHandler';
import { CreateEventCommand } from '@application/commands/CreateEventCommand';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';
import { DomainError } from '@shared/errors/DomainError';
import { Position } from '@domain/value-objects/Position';

describe('CreateEventHandler', () => {
    let handler: CreateEventHandler;
    let repository: InMemoryEventRepository;
    let boardId: string;

    beforeEach(() => {
        repository = new InMemoryEventRepository();
        handler = new CreateEventHandler(repository);

        const board = EventStormingBoard.create(BoardId.generate());
        boardId = board.id.value;
        repository.save(board);
    });

    it('새로운 이벤트를 생성할 수 있다', async () => {
        const command = new CreateEventCommand(
            boardId,
            '사용자 등록됨',
            'domain-event',
            100,
            200
        );

        await handler.handle(command);

        const board = await repository.load(new BoardId(boardId));
        expect(board.getEventCount()).toBe(1);
    });

    it('description을 포함하여 생성할 수 있다', async () => {
        const command = new CreateEventCommand(
            boardId,
            '사용자 등록됨',
            'domain-event',
            100,
            200,
            '신규 사용자 회원가입'
        );

        await handler.handle(command);

        const board = await repository.load(new BoardId(boardId));
        const events = board.getAllEvents();
        expect(events[0].description).toBe('신규 사용자 회원가입');
    });

    it('유효하지 않은 이벤트 타입은 에러를 발생시킨다', async () => {
        const command = new CreateEventCommand(
            boardId,
            '사용자 등록됨',
            'invalid-type',
            100,
            200
        );

        await expect(handler.handle(command)).rejects.toThrow(DomainError);
    });

    it('존재하지 않는 보드에는 이벤트를 추가할 수 없다', async () => {
        const command = new CreateEventCommand(
            'non-existent-board-id',
            '사용자 등록됨',
            'domain-event',
            100,
            200
        );

        await expect(handler.handle(command)).rejects.toThrow();
    });

    it('겹치는 위치로 생성 요청해도 근처 빈 위치에 자동 배치한다', async () => {
        await handler.handle(
            new CreateEventCommand(boardId, 'Event A', 'domain-event', 100, 200)
        );
        await handler.handle(
            new CreateEventCommand(boardId, 'Event B', 'domain-event', 100, 200)
        );

        const board = await repository.load(new BoardId(boardId));
        const events = board.getAllEvents();
        expect(events.length).toBe(2);

        const first = events.find((event) => event.name.value === 'Event A');
        const second = events.find((event) => event.name.value === 'Event B');
        expect(first).toBeDefined();
        expect(second).toBeDefined();

        const distance = first!.position.distanceTo(second!.position);
        expect(distance).toBeGreaterThanOrEqual(50);
        expect(second!.position.equals(new Position(100, 200))).toBe(false);
    });
});
