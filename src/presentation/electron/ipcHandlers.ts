import { ipcMain } from 'electron';

import { CreateEventHandler } from '@application/commands/CreateEventHandler';
import { MoveEventHandler } from '@application/commands/MoveEventHandler';
import { DeleteEventHandler } from '@application/commands/DeleteEventHandler';
import { RenameEventHandler } from '@application/commands/RenameEventHandler';
import { DetectAggregatesHandler } from '@application/commands/DetectAggregatesHandler';
import { GetBoardStateHandler } from '@application/queries/GetBoardStateHandler';

import { CreateEventCommand } from '@application/commands/CreateEventCommand';
import { MoveEventCommand } from '@application/commands/MoveEventCommand';
import { DeleteEventCommand } from '@application/commands/DeleteEventCommand';
import { RenameEventCommand } from '@application/commands/RenameEventCommand';
import { DetectAggregatesCommand } from '@application/commands/DetectAggregatesCommand';
import { GetBoardStateQuery } from '@application/queries/GetBoardStateQuery';

import { FileSystemBoardRepository } from '@infrastructure/repositories/FileSystemBoardRepository';

import { loadAppConfig, saveAppConfig } from './AppConfigStore.js';

let repository: FileSystemBoardRepository | null = null;
let repositoryPath: string | null = null;

async function getRepository(): Promise<FileSystemBoardRepository> {
    const config = await loadAppConfig();
    if (!repository || repositoryPath !== config.boardsPath) {
        repository = new FileSystemBoardRepository(config.boardsPath);
        repositoryPath = config.boardsPath;
    }
    return repository;
}

export function setupIPCHandlers(): void {
    ipcMain.handle('create-event', async (_event, args) => {
        const repo = await getRepository();
        const createEventHandler = new CreateEventHandler(repo as any);
        const command = new CreateEventCommand(
            args.boardId,
            args.name,
            args.type,
            args.x,
            args.y,
            args.description
        );
        await createEventHandler.handle(command);
    });

    ipcMain.handle('move-event', async (_event, args) => {
        const repo = await getRepository();
        const moveEventHandler = new MoveEventHandler(repo as any);
        const command = new MoveEventCommand(
            args.boardId,
            args.eventId,
            args.newX,
            args.newY
        );
        await moveEventHandler.handle(command);
    });

    ipcMain.handle('delete-event', async (_event, args) => {
        const repo = await getRepository();
        const deleteEventHandler = new DeleteEventHandler(repo as any);
        const command = new DeleteEventCommand(args.boardId, args.eventId);
        await deleteEventHandler.handle(command);
    });

    ipcMain.handle('rename-event', async (_event, args) => {
        const repo = await getRepository();
        const renameEventHandler = new RenameEventHandler(repo as any);
        const command = new RenameEventCommand(args.boardId, args.eventId, args.newName);
        await renameEventHandler.handle(command);
    });

    ipcMain.handle('detect-aggregates', async (_event, args) => {
        const repo = await getRepository();
        const detectAggregatesHandler = new DetectAggregatesHandler(repo as any);
        const command = new DetectAggregatesCommand(args.boardId);
        await detectAggregatesHandler.handle(command);
    });

    ipcMain.handle('get-board-state', async (_event, args) => {
        const repo = await getRepository();
        const getBoardStateHandler = new GetBoardStateHandler(repo as any);
        const query = new GetBoardStateQuery(args.boardId);
        return await getBoardStateHandler.handle(query);
    });

    ipcMain.handle('list-boards', async () => {
        const repo = await getRepository();
        return await repo.listBoards();
    });

    ipcMain.handle('get-config', async () => {
        return await loadAppConfig();
    });

    ipcMain.handle('update-boards-path', async (_event, args) => {
        const config = await saveAppConfig({ boardsPath: args.boardsPath });
        repository = new FileSystemBoardRepository(config.boardsPath);
        repositoryPath = config.boardsPath;
        return config;
    });

    ipcMain.handle('create-board', async (_event, args) => {
        const repo = await getRepository();
        const { EventStormingBoard } = await import('@domain/services/EventStormingBoard');
        const { BoardId } = await import('@domain/value-objects/BoardId');

        const board = EventStormingBoard.create(BoardId.generate());
        await repo.registerBoardName(board.id, args.name);
        await repo.save(board);
        return board.id.value;
    });
}
