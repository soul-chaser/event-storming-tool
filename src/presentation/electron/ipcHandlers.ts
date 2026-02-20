import { ipcMain } from 'electron';

import { CreateEventHandler } from '@core/application/commands/CreateEventHandler.js';
import { MoveEventHandler } from '@core/application/commands/MoveEventHandler.js';
import { DeleteEventHandler } from '@core/application/commands/DeleteEventHandler.js';
import { RenameEventHandler } from '@core/application/commands/RenameEventHandler.js';
import { DetectAggregatesHandler } from '@core/application/commands/DetectAggregatesHandler.js';
import { GetBoardStateHandler } from '@core/application/queries/GetBoardStateHandler.js';

import { CreateEventCommand } from '@core/application/commands/CreateEventCommand.js';
import { MoveEventCommand } from '@core/application/commands/MoveEventCommand.js';
import { DeleteEventCommand } from '@core/application/commands/DeleteEventCommand.js';
import { RenameEventCommand } from '@core/application/commands/RenameEventCommand.js';
import { DetectAggregatesCommand } from '@core/application/commands/DetectAggregatesCommand.js';
import { GetBoardStateQuery } from '@core/application/queries/GetBoardStateQuery.js';

import { FileSystemBoardRepository } from '@core/infrastructure/repositories/FileSystemBoardRepository.js';

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
        const { EventStormingBoard } = await import('@core/domain/services/EventStormingBoard.js');
        const { BoardId } = await import('@core/domain/value-objects/BoardId.js');

        const board = EventStormingBoard.create(BoardId.generate());
        await repo.registerBoardName(board.id, args.name);
        await repo.save(board);
        return board.id.value;
    });
}
