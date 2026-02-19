import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileSystemBoardRepository } from '@infrastructure/repositories/FileSystemBoardRepository';
import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';
import { Event } from '@domain/entities/Event';
import { EventName } from '@domain/value-objects/EventName';
import { EventType } from '@domain/value-objects/EventType';
import { Position } from '@domain/value-objects/Position';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('FileSystemBoardRepository', () => {
    let repository: FileSystemBoardRepository;
    let testDir: string;

    beforeEach(async () => {
        testDir = path.join(process.cwd(), 'test-repo-data');
        await fs.mkdir(testDir, { recursive: true });
        repository = new FileSystemBoardRepository(testDir);
    });

    afterEach(async () => {
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        } catch (e) {
            // ignore
        }
    });

    describe('save', () => {
        it('보드를 파일로 저장할 수 있다', async () => {
            const board = EventStormingBoard.create(BoardId.generate());

            await repository.save(board);

            const filename = `${board.id.value}.json`;
            const filePath = path.join(testDir, filename);
            const exists = await fs.access(filePath).then(() => true).catch(() => false);
            expect(exists).toBe(true);
        });

        it('이벤트가 있는 보드를 저장할 수 있다', async () => {
            const board = EventStormingBoard.create(BoardId.generate());
            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            board.addEvent(event);

            await repository.save(board);

            const loaded = await repository.load(board.id);
            expect(loaded.getEventCount()).toBe(1);
        });

        it('기존 파일을 덮어쓸 수 있다', async () => {
            const board = EventStormingBoard.create(BoardId.generate());
            await repository.save(board);

            const event = Event.create({
                name: new EventName('새 이벤트'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
            });
            board.addEvent(event);
            await repository.save(board);

            const loaded = await repository.load(board.id);
            expect(loaded.getEventCount()).toBe(1);
        });
    });

    describe('load', () => {
        it('저장된 보드를 로드할 수 있다', async () => {
            const board = EventStormingBoard.create(BoardId.generate());
            await repository.save(board);

            const loaded = await repository.load(board.id);

            expect(loaded.id.value).toBe(board.id.value);
        });

        it('존재하지 않는 보드는 에러를 발생시킨다', async () => {
            const boardId = BoardId.generate();

            await expect(repository.load(boardId)).rejects.toThrow();
        });

        it('이벤트가 있는 보드를 로드할 수 있다', async () => {
            const board = EventStormingBoard.create(BoardId.generate());
            const event = Event.create({
                name: new EventName('사용자 등록됨'),
                type: new EventType('domain-event'),
                position: new Position(100, 200),
                description: '신규 사용자',
            });
            board.addEvent(event);
            await repository.save(board);

            const loaded = await repository.load(board.id);

            expect(loaded.getEventCount()).toBe(1);
            const loadedEvents = loaded.getAllEvents();
            expect(loadedEvents[0].name.value).toBe('사용자 등록됨');
            expect(loadedEvents[0].description).toBe('신규 사용자');
        });
    });

    describe('exists', () => {
        it('저장된 보드는 true를 반환한다', async () => {
            const board = EventStormingBoard.create(BoardId.generate());
            await repository.save(board);

            const exists = await repository.exists(board.id);

            expect(exists).toBe(true);
        });

        it('저장되지 않은 보드는 false를 반환한다', async () => {
            const boardId = BoardId.generate();

            const exists = await repository.exists(boardId);

            expect(exists).toBe(false);
        });
    });

    describe('delete', () => {
        it('보드를 삭제할 수 있다', async () => {
            const board = EventStormingBoard.create(BoardId.generate());
            await repository.save(board);

            await repository.delete(board.id);

            const exists = await repository.exists(board.id);
            expect(exists).toBe(false);
        });

        it('존재하지 않는 보드 삭제는 에러를 발생시키지 않는다', async () => {
            const boardId = BoardId.generate();

            await expect(repository.delete(boardId)).resolves.not.toThrow();
        });
    });

    describe('listAll', () => {
        it('모든 보드 ID를 나열할 수 있다', async () => {
            const board1 = EventStormingBoard.create(BoardId.generate());
            const board2 = EventStormingBoard.create(BoardId.generate());
            const board3 = EventStormingBoard.create(BoardId.generate());

            await repository.save(board1);
            await repository.save(board2);
            await repository.save(board3);

            const boardIds = await repository.listAll();

            expect(boardIds).toHaveLength(3);
            expect(boardIds).toContain(board1.id.value);
            expect(boardIds).toContain(board2.id.value);
            expect(boardIds).toContain(board3.id.value);
        });

        it('빈 저장소는 빈 배열을 반환한다', async () => {
            const boardIds = await repository.listAll();

            expect(boardIds).toHaveLength(0);
        });
    });
});