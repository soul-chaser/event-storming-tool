import { BrowserWindow, dialog, ipcMain } from 'electron';
import { writeFile } from 'node:fs/promises';

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
import {
    formatBoardAsMermaid,
    formatBoardAsPlantUML,
} from '@application/services/BoardExportFormatter';

import { FileSystemBoardRepository } from '@infrastructure/repositories/FileSystemBoardRepository';

import { loadAppConfig, saveAppConfig } from './AppConfigStore.js';

let repository: FileSystemBoardRepository | null = null;
let repositoryPath: string | null = null;
type ExportFormat = 'mermaid' | 'plantuml' | 'pdf' | 'png';

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

    ipcMain.handle('choose-export-path', async (_event, args: { boardId: string; format: ExportFormat }) => {
        const extensionByFormat: Record<ExportFormat, string> = {
            mermaid: 'mmd',
            plantuml: 'puml',
            pdf: 'pdf',
            png: 'png',
        };
        const labelByFormat: Record<ExportFormat, string> = {
            mermaid: 'Mermaid',
            plantuml: 'PlantUML',
            pdf: 'PDF',
            png: 'PNG',
        };

        const extension = extensionByFormat[args.format];
        const result = await dialog.showSaveDialog({
            title: `${labelByFormat[args.format]} Export`,
            defaultPath: `event-storming-${args.boardId}.${extension}`,
            filters: [{ name: labelByFormat[args.format], extensions: [extension] }],
        });

        if (result.canceled || !result.filePath) {
            return null;
        }

        return result.filePath;
    });

    ipcMain.handle('export-board', async (_event, args: {
        boardId: string;
        format: ExportFormat;
        outputPath: string;
        imageDataUrl?: string;
    }) => {
        const repo = await getRepository();
        const getBoardStateHandler = new GetBoardStateHandler(repo as any);
        const query = new GetBoardStateQuery(args.boardId);
        const boardState = await getBoardStateHandler.handle(query);

        if (args.format === 'mermaid') {
            await writeFile(args.outputPath, formatBoardAsMermaid(boardState), 'utf-8');
            return { outputPath: args.outputPath };
        }

        if (args.format === 'plantuml') {
            await writeFile(args.outputPath, formatBoardAsPlantUML(boardState), 'utf-8');
            return { outputPath: args.outputPath };
        }

        if (!args.imageDataUrl) {
            throw new Error('Image data is required for PNG/PDF export.');
        }

        const base64Payload = args.imageDataUrl.replace(/^data:image\/png;base64,/, '');
        const pngBuffer = Buffer.from(base64Payload, 'base64');

        if (args.format === 'png') {
            await writeFile(args.outputPath, pngBuffer);
            return { outputPath: args.outputPath };
        }

        const pdfWindow = new BrowserWindow({
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            },
        });

        try {
            const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    html, body { margin: 0; padding: 0; background: #ffffff; }
    .page { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
    img { width: 100%; height: auto; object-fit: contain; }
  </style>
</head>
<body>
  <div class="page">
    <img src="${args.imageDataUrl}" alt="Event Storming Export" />
  </div>
</body>
</html>`;

            await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
            const pdfBuffer = await pdfWindow.webContents.printToPDF({
                printBackground: true,
                landscape: true,
                pageSize: 'A4',
            });
            await writeFile(args.outputPath, pdfBuffer);
        } finally {
            if (!pdfWindow.isDestroyed()) {
                pdfWindow.close();
            }
        }

        return { outputPath: args.outputPath };
    });
}
