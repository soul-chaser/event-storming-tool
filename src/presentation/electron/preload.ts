import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload 스크립트
 *
 * 렌더러 프로세스에 안전한 API를 노출합니다.
 */

// ElectronAPI 타입 정의
export interface ElectronAPI {
    chooseExportPath: (args: {
        boardId: string;
        format: 'mermaid' | 'plantuml' | 'pdf' | 'png';
    }) => Promise<string | null>;
    exportBoard: (args: {
        boardId: string;
        format: 'mermaid' | 'plantuml' | 'pdf' | 'png';
        outputPath: string;
        imageDataUrl?: string;
    }) => Promise<{ outputPath: string }>;
    createBoard: (args: { name: string }) => Promise<string>;
    listBoards: () => Promise<Array<{
        id: string;
        name: string;
        fileName: string;
        updatedAt: string;
    }>>;
    getConfig: () => Promise<{ boardsPath: string }>;
    updateBoardsPath: (args: { boardsPath: string }) => Promise<{ boardsPath: string }>;

    // Commands
    createEvent: (args: {
        boardId: string;
        name: string;
        type: string;
        x: number;
        y: number;
        description?: string;
    }) => Promise<void>;

    moveEvent: (args: {
        boardId: string;
        eventId: string;
        newX: number;
        newY: number;
    }) => Promise<void>;

    deleteEvent: (args: {
        boardId: string;
        eventId: string;
    }) => Promise<void>;

    renameEvent: (args: {
        boardId: string;
        eventId: string;
        newName: string;
    }) => Promise<void>;

    detectAggregates: (args: {
        boardId: string;
    }) => Promise<void>;

    // Queries
    getBoardState: (args: {
        boardId: string;
    }) => Promise<any>;
}

// API를 window 객체에 노출
contextBridge.exposeInMainWorld('electronAPI', {
    chooseExportPath: (args) => ipcRenderer.invoke('choose-export-path', args),
    exportBoard: (args) => ipcRenderer.invoke('export-board', args),
    createBoard: (args) => ipcRenderer.invoke('create-board', args),
    listBoards: () => ipcRenderer.invoke('list-boards'),
    getConfig: () => ipcRenderer.invoke('get-config'),
    updateBoardsPath: (args) => ipcRenderer.invoke('update-boards-path', args),
    createEvent: (args) => ipcRenderer.invoke('create-event', args),
    moveEvent: (args) => ipcRenderer.invoke('move-event', args),
    deleteEvent: (args) => ipcRenderer.invoke('delete-event', args),
    renameEvent: (args) => ipcRenderer.invoke('rename-event', args),
    detectAggregates: (args) => ipcRenderer.invoke('detect-aggregates', args),
    getBoardState: (args) => ipcRenderer.invoke('get-board-state', args),
} as ElectronAPI);

// TypeScript 타입 선언
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
