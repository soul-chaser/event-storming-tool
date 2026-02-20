import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';
import { Event } from '@domain/entities/Event';
import { EventName } from '@domain/value-objects/EventName';
import { EventType } from '@domain/value-objects/EventType';
import { Position } from '@domain/value-objects/Position';
import { JSONSerializer } from '@infrastructure/adapters/JSONSerializer';

type HandlerMap = Record<string, (_event: unknown, args?: any) => Promise<any>>;

const handlerMap: HandlerMap = {};
let tempDir: string;

vi.mock('electron', () => ({
    ipcMain: {
        handle: vi.fn((channel: string, handler: HandlerMap[string]) => {
            handlerMap[channel] = handler;
        }),
    },
    dialog: {
        showSaveDialog: vi.fn(),
        showOpenDialog: vi.fn(),
    },
    BrowserWindow: vi.fn(() => ({
        loadURL: vi.fn(),
        webContents: {
            printToPDF: vi.fn(),
        },
        isDestroyed: vi.fn(() => false),
        close: vi.fn(),
    })),
}));

vi.mock('@presentation/electron/AppConfigStore.js', () => ({
    loadAppConfig: vi.fn(async () => ({ boardsPath: tempDir })),
    saveAppConfig: vi.fn(async (nextConfig: { boardsPath: string }) => {
        tempDir = nextConfig.boardsPath;
        return { boardsPath: tempDir };
    }),
}));

describe('ipcHandlers', () => {
    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ipc-handlers-test-'));
        for (const key of Object.keys(handlerMap)) {
            delete handlerMap[key];
        }

        vi.resetModules();
        const { setupIPCHandlers } = await import('@presentation/electron/ipcHandlers');
        setupIPCHandlers();
    });

    afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('import-board-json은 유효하지 않은 JSON 파일을 거부한다', async () => {
        const invalidPath = path.join(tempDir, 'invalid.json');
        await fs.writeFile(invalidPath, '{"hello":"world"}', 'utf-8');

        await expect(handlerMap['import-board-json']({}, { filePath: invalidPath }))
            .rejects
            .toThrow('Missing version information');
    });

    it('import-board-json은 유효한 JSON 파일을 가져오고 목록에 반영한다', async () => {
        const board = EventStormingBoard.create(BoardId.generate());
        board.addEvent(Event.create({
            name: new EventName('사용자 등록됨'),
            type: new EventType('domain-event'),
            position: new Position(100, 200),
            description: '설명',
        }));

        const serializer = new JSONSerializer();
        const filePath = path.join(tempDir, 'import-board.json');
        await fs.writeFile(filePath, serializer.serialize(board), 'utf-8');

        const result = await handlerMap['import-board-json']({}, { filePath, boardName: '가져온 보드' });
        const list = await handlerMap['list-boards']({}, {});

        expect(result.boardId).toBe(board.id.value);
        expect(list).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: board.id.value, name: '가져온 보드' }),
        ]));
    });

    it('import-board-json은 targetBoardId가 있으면 현재 보드 내용을 덮어쓴다', async () => {
        const currentBoardId = await handlerMap['create-board']({}, { name: '현재 보드' });
        await handlerMap['create-event']({}, {
            boardId: currentBoardId,
            name: '기존 카드',
            type: 'domain-event',
            x: 100,
            y: 120,
        });

        const importedBoard = EventStormingBoard.create(BoardId.generate());
        importedBoard.addEvent(Event.create({
            name: new EventName('가져온 카드'),
            type: new EventType('command'),
            position: new Position(300, 400),
            description: 'imported',
        }));

        const serializer = new JSONSerializer();
        const filePath = path.join(tempDir, 'overwrite-import.json');
        await fs.writeFile(filePath, serializer.serialize(importedBoard), 'utf-8');

        const result = await handlerMap['import-board-json']({}, {
            filePath,
            targetBoardId: currentBoardId,
        });
        const boardState = await handlerMap['get-board-state']({}, { boardId: currentBoardId });

        expect(result.boardId).toBe(currentBoardId);
        expect(boardState.events).toHaveLength(1);
        expect(boardState.events[0].name).toBe('가져온 카드');
        expect(boardState.events[0].type).toBe('command');
        expect(boardState.events[0].position).toEqual({ x: 300, y: 400 });
    });

    it('replace-board-snapshot은 boardId가 다른 스냅샷을 거부한다', async () => {
        const createdBoardId = await handlerMap['create-board']({}, { name: 'undo target' });

        const anotherBoard = EventStormingBoard.create(BoardId.generate());
        const serializer = new JSONSerializer();
        const snapshot = serializer.serialize(anotherBoard);

        await expect(handlerMap['replace-board-snapshot']({}, {
            boardId: createdBoardId,
            snapshot,
        })).rejects.toThrow('Snapshot boardId does not match target board');
    });

    it('get-board-snapshot은 보드 JSON 스냅샷을 반환한다', async () => {
        const boardId = await handlerMap['create-board']({}, { name: 'snapshot board' });

        const snapshot = await handlerMap['get-board-snapshot']({}, { boardId });
        const parsed = JSON.parse(snapshot) as { boardId: string; version: string };

        expect(parsed.boardId).toBe(boardId);
        expect(parsed.version).toBe('1.0');
    });
});
