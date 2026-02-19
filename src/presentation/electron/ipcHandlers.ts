import { ipcMain } from 'electron';
import { CreateEventHandler } from '@application/commands/CreateEventHandler.ts';
import { MoveEventHandler } from '@application/commands/MoveEventHandler.ts';
import { DeleteEventHandler } from '@application/commands/DeleteEventHandler.ts';
import { DetectAggregatesHandler } from '@application/commands/DetectAggregatesHandler.ts';
import { GetBoardStateHandler } from '@application/queries/GetBoardStateHandler.ts';
import { CreateEventCommand } from '@application/commands/CreateEventCommand.ts';
import { MoveEventCommand } from '@application/commands/MoveEventCommand.ts';
import { DeleteEventCommand } from '@application/commands/DeleteEventCommand.ts';
import { DetectAggregatesCommand } from '@application/commands/DetectAggregatesCommand.ts';
import { GetBoardStateQuery } from '@application/queries/GetBoardStateQuery.ts';
import { FileSystemBoardRepository } from '@infrastructure/repositories/FileSystemBoardRepository.ts';
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

/**
 * IPC 핸들러를 설정합니다.
 */
export function setupIPCHandlers(): void {
    // Command: 이벤트 생성
    ipcMain.handle('create-event', async (event, args) => {
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

    // Command: 이벤트 이동
    ipcMain.handle('move-event', async (event, args) => {
        const command = new MoveEventCommand(
            args.boardId,
            args.eventId,
            args.newX,
            args.newY
        );
        await moveEventHandler.handle(command);
    });

    // Command: 이벤트 삭제
    ipcMain.handle('delete-event', async (event, args) => {
        const command = new DeleteEventCommand(args.boardId, args.eventId);
        await deleteEventHandler.handle(command);
    });

    // Command: Aggregate 감지
    ipcMain.handle('detect-aggregates', async (event, args) => {
        const command = new DetectAggregatesCommand(args.boardId);
        await detectAggregatesHandler.handle(command);
    });

    // Query: 보드 상태 조회
    ipcMain.handle('get-board-state', async (event, args) => {
        const query = new GetBoardStateQuery(args.boardId);
        return await getBoardStateHandler.handle(query);
    });

    // Query: 보드 목록 조회
    ipcMain.handle('list-boards', async () => {
        return await repository.listAll();
    });

    // Command: 새 보드 생성
    ipcMain.handle('create-board', async () => {
        const { EventStormingBoard } = await import('@domain/services/EventStormingBoard');
        const { BoardId } = await import('@domain/value-objects/BoardId');

        const board = EventStormingBoard.create(BoardId.generate());
        await repository.save(board);
        return board.id.value;
    });
}