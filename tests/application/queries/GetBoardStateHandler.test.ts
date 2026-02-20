import { describe, it, expect, beforeEach } from 'vitest';
import { GetBoardStateHandler } from '@application/queries/GetBoardStateHandler';
import { GetBoardStateQuery } from '@application/queries/GetBoardStateQuery';
import { CreateEventHandler } from '@application/commands/CreateEventHandler';
import { CreateEventCommand } from '@application/commands/CreateEventCommand';
import { DetectAggregatesHandler } from '@application/commands/DetectAggregatesHandler';
import { DetectAggregatesCommand } from '@application/commands/DetectAggregatesCommand';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';

describe('GetBoardStateHandler', () => {
    let handler: GetBoardStateHandler;
    let createHandler: CreateEventHandler;
    let detectHandler: DetectAggregatesHandler;
    let repository: InMemoryEventRepository;
    let boardId: string;

    beforeEach(async () => {
        repository = new InMemoryEventRepository();
        handler = new GetBoardStateHandler(repository);
        createHandler = new CreateEventHandler(repository);
        detectHandler = new DetectAggregatesHandler(repository);

        const board = EventStormingBoard.create(BoardId.generate());
        boardId = board.id.value;
        await repository.save(board);
    });

    it('빈 보드 상태를 조회할 수 있다', async () => {
        const query = new GetBoardStateQuery(boardId);
        const state = await handler.handle(query);

        expect(state.id).toBe(boardId);
        expect(state.events).toHaveLength(0);
        expect(state.aggregates).toHaveLength(0);
    });

    it('이벤트가 있는 보드 상태를 조회할 수 있다', async () => {
        await createHandler.handle(
            new CreateEventCommand(boardId, '사용자 등록됨', 'domain-event', 100, 200)
        );

        const query = new GetBoardStateQuery(boardId);
        const state = await handler.handle(query);

        expect(state.events).toHaveLength(1);
        expect(state.events[0].name).toBe('사용자 등록됨');
        expect(state.events[0].type).toBe('domain-event');
    });

    it('EventDTO에 모든 필수 정보가 포함된다', async () => {
        await createHandler.handle(
            new CreateEventCommand(
                boardId,
                '사용자 등록됨',
                'domain-event',
                100,
                200,
                '신규 사용자'
            )
        );

        const query = new GetBoardStateQuery(boardId);
        const state = await handler.handle(query);

        const eventDTO = state.events[0];
        expect(eventDTO.id).toBeDefined();
        expect(eventDTO.name).toBe('사용자 등록됨');
        expect(eventDTO.type).toBe('domain-event');
        expect(eventDTO.position).toEqual({ x: 100, y: 200 });
        expect(eventDTO.description).toBe('신규 사용자');
        expect(eventDTO.color).toBe('#FFA500'); // domain-event 색상
        expect(eventDTO.createdAt).toBeDefined();
        expect(eventDTO.lastModified).toBeDefined();
    });

    it('Aggregate가 있는 보드 상태를 조회할 수 있다', async () => {
        await createHandler.handle(
            new CreateEventCommand(boardId, '이벤트1', 'domain-event', 100, 200)
        );
        await createHandler.handle(
            new CreateEventCommand(boardId, '이벤트2', 'domain-event', 150, 200)
        );

        await detectHandler.handle(new DetectAggregatesCommand(boardId));

        const query = new GetBoardStateQuery(boardId);
        const state = await handler.handle(query);

        expect(state.aggregates.length).toBeGreaterThan(0);
    });

    it('AggregateDTO에 모든 필수 정보가 포함된다', async () => {
        await createHandler.handle(
            new CreateEventCommand(boardId, '이벤트1', 'domain-event', 100, 200)
        );
        await createHandler.handle(
            new CreateEventCommand(boardId, '이벤트2', 'domain-event', 150, 200)
        );

        await detectHandler.handle(new DetectAggregatesCommand(boardId));

        const query = new GetBoardStateQuery(boardId);
        const state = await handler.handle(query);

        const aggregateDTO = state.aggregates[0];
        expect(aggregateDTO.id).toBeDefined();
        expect(aggregateDTO.name).toBeDefined();
        expect(aggregateDTO.eventIds).toBeDefined();
        expect(aggregateDTO.eventIds.length).toBeGreaterThan(0);
        expect(aggregateDTO.bounds).toBeDefined();
        expect(aggregateDTO.bounds?.minX).toBeDefined();
        expect(aggregateDTO.bounds?.maxX).toBeDefined();
    });

    it('존재하지 않는 보드는 조회할 수 없다', async () => {
        const query = new GetBoardStateQuery('non-existent-board');

        await expect(handler.handle(query)).rejects.toThrow();
    });

    it('여러 이벤트와 Aggregate가 있는 복잡한 보드를 조회할 수 있다', async () => {
        // 클러스터 1
        await createHandler.handle(
            new CreateEventCommand(boardId, '사용자 등록', 'command', 100, 200)
        );
        await createHandler.handle(
            new CreateEventCommand(boardId, '사용자 등록됨', 'domain-event', 150, 200)
        );

        // 클러스터 2
        await createHandler.handle(
            new CreateEventCommand(boardId, '주문 생성', 'command', 1000, 200)
        );
        await createHandler.handle(
            new CreateEventCommand(boardId, '주문 생성됨', 'domain-event', 1050, 200)
        );

        await detectHandler.handle(new DetectAggregatesCommand(boardId));

        const query = new GetBoardStateQuery(boardId);
        const state = await handler.handle(query);

        expect(state.events).toHaveLength(4);
        expect(state.aggregates.length).toBeGreaterThan(0);
    });

    it('카드 연결선 정보를 조회할 수 있다', async () => {
        await createHandler.handle(
            new CreateEventCommand(boardId, '주문 생성', 'command', 100, 200)
        );
        await createHandler.handle(
            new CreateEventCommand(boardId, '주문 생성됨', 'domain-event', 300, 200)
        );

        const updated = await repository.load(new BoardId(boardId));
        const [first, second] = updated.getAllEvents();
        updated.addConnection(first.id, second.id);
        await repository.save(updated);

        const query = new GetBoardStateQuery(boardId);
        const state = await handler.handle(query);

        expect(state.connections).toEqual([
            {
                sourceId: first.id.value,
                targetId: second.id.value,
            },
        ]);
    });
});
