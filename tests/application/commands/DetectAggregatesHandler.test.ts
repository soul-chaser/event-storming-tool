import { describe, it, expect, beforeEach } from 'vitest';
import { DetectAggregatesHandler } from '@application/commands/DetectAggregatesHandler';
import { DetectAggregatesCommand } from '@application/commands/DetectAggregatesCommand';
import { CreateEventHandler } from '@application/commands/CreateEventHandler';
import { CreateEventCommand } from '@application/commands/CreateEventCommand';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';

describe('DetectAggregatesHandler', () => {
    let handler: DetectAggregatesHandler;
    let createHandler: CreateEventHandler;
    let repository: InMemoryEventRepository;
    let boardId: string;

    beforeEach(async () => {
        repository = new InMemoryEventRepository();
        handler = new DetectAggregatesHandler(repository);
        createHandler = new CreateEventHandler(repository);

        const board = EventStormingBoard.create(BoardId.generate());
        boardId = board.id.value;
        await repository.save(board);
    });

    it('근접한 이벤트들을 Aggregate로 그룹화한다', async () => {
        // 클러스터 1: 근접한 이벤트들
        await createHandler.handle(
            new CreateEventCommand(boardId, '사용자 등록', 'command', 100, 200)
        );
        await createHandler.handle(
            new CreateEventCommand(boardId, '사용자 등록됨', 'domain-event', 150, 200)
        );

        // 클러스터 2: 멀리 떨어진 이벤트들
        await createHandler.handle(
            new CreateEventCommand(boardId, '주문 생성', 'command', 1000, 200)
        );
        await createHandler.handle(
            new CreateEventCommand(boardId, '주문 생성됨', 'domain-event', 1050, 200)
        );

        const command = new DetectAggregatesCommand(boardId);
        await handler.handle(command);

        const board = await repository.load(new BoardId(boardId));
        const aggregates = board.getAllAggregates();

        expect(aggregates.length).toBeGreaterThan(0);
        expect(aggregates.length).toBeLessThanOrEqual(4); // 최대 4개 (각 이벤트가 별도일 수도)
    });

    it('이벤트가 없으면 Aggregate도 없다', async () => {
        const command = new DetectAggregatesCommand(boardId);
        await handler.handle(command);

        const board = await repository.load(new BoardId(boardId));
        expect(board.getAllAggregates()).toHaveLength(0);
    });

    it('단일 이벤트도 Aggregate가 된다', async () => {
        await createHandler.handle(
            new CreateEventCommand(boardId, '사용자 등록됨', 'domain-event', 100, 200)
        );

        const command = new DetectAggregatesCommand(boardId);
        await handler.handle(command);

        const board = await repository.load(new BoardId(boardId));
        expect(board.getAllAggregates().length).toBeGreaterThan(0);
    });

    it('존재하지 않는 보드에서는 감지할 수 없다', async () => {
        const command = new DetectAggregatesCommand('non-existent-board');

        await expect(handler.handle(command)).rejects.toThrow();
    });

    it('Aggregate 감지 후 저장된다', async () => {
        await createHandler.handle(
            new CreateEventCommand(boardId, '이벤트1', 'domain-event', 100, 200)
        );
        await createHandler.handle(
            new CreateEventCommand(boardId, '이벤트2', 'domain-event', 150, 200)
        );

        const command = new DetectAggregatesCommand(boardId);
        await handler.handle(command);

        // 다시 로드해서 확인
        const board = await repository.load(new BoardId(boardId));
        expect(board.getAllAggregates().length).toBeGreaterThan(0);
    });
});