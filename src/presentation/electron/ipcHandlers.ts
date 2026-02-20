import { ipcMain } from 'electron';

import { CreateEventHandler } from '@core/application/commands/CreateEventHandler.js';
import { MoveEventHandler } from '@core/application/commands/MoveEventHandler.js';
import { DeleteEventHandler } from '@core/application/commands/DeleteEventHandler.js';
import { DetectAggregatesHandler } from '@core/application/commands/DetectAggregatesHandler.js';
import { GetBoardStateHandler } from '@core/application/queries/GetBoardStateHandler.js';

import { CreateEventCommand } from '@core/application/commands/CreateEventCommand.js';
import { MoveEventCommand } from '@core/application/commands/MoveEventCommand.js';
import { DeleteEventCommand } from '@core/application/commands/DeleteEventCommand.js';
import { DetectAggregatesCommand } from '@core/application/commands/DetectAggregatesCommand.js';
import { GetBoardStateQuery } from '@core/application/queries/GetBoardStateQuery.js';

import { FileSystemBoardRepository } from '@core/infrastructure/repositories/FileSystemBoardRepository.js';

import * as path from 'path';
import * as os from 'os';

// 저장소 초기화
const dataPath = path.join(os.homedir(), '.event-storming-tool', 'boards');
const repository = new FileSystemBoardRepository(dataPath);

// 핸들러 초기화
const createEventHandler = new CreateEventHandler(repository as any);
const moveEventHandler = new MoveEventHandler(repository as any);
const deleteEventHandler = new DeleteEventHandler(repository as any);
const detectAggregatesHandler = new DetectAggregatesHandler(repository as any);
const getBoardStateHandler = new GetBoardStateHandler(repository as any);

export function setupIPCHandlers(): void {
    ipcMain.handle('create-event', async (_event, args) => {
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
        const command = new MoveEventCommand(
            args.boardId,
            args.eventId,
            args.newX,
            args.newY
        );
        await moveEventHandler.handle(command);
    });

    ipcMain.handle('delete-event', async (_event, args) => {
        const command = new DeleteEventCommand(args.boardId, args.eventId);
        await deleteEventHandler.handle(command);
    });

    ipcMain.handle('detect-aggregates', async (_event, args) => {
        const command = new DetectAggregatesCommand(args.boardId);
        await detectAggregatesHandler.handle(command);
    });

    ipcMain.handle('get-board-state', async (_event, args) => {
        const query = new GetBoardStateQuery(args.boardId);
        return await getBoardStateHandler.handle(query);
    });

    ipcMain.handle('list-boards', async () => {
        return await repository.listAll();
    });

    ipcMain.handle('create-board', async () => {
        const { EventStormingBoard } = await import('@core/domain/services/EventStormingBoard.js');
        const { BoardId } = await import('@core/domain/value-objects/BoardId.js');

        const board = EventStormingBoard.create(BoardId.generate());
        await repository.save(board);
        return board.id.value;
    });
}