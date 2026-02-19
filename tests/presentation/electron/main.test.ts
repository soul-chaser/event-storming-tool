import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { app, BrowserWindow } from 'electron';

// Electron mocks
vi.mock('electron', () => ({
    app: {
        on: vi.fn(),
        whenReady: vi.fn(() => Promise.resolve()),
        quit: vi.fn(),
    },
    BrowserWindow: vi.fn(() => ({
        loadFile: vi.fn(),
        webContents: {
            on: vi.fn(),
        },
        on: vi.fn(),
    })),
    ipcMain: {
        handle: vi.fn(),
        on: vi.fn(),
    },
}));

describe('Electron Main Process', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('App 초기화', () => {
        it('앱이 준비되면 BrowserWindow를 생성한다', async () => {
            const { createWindow } = await import('@presentation/electron/main');

            const window = createWindow();

            expect(BrowserWindow).toHaveBeenCalled();
        });

        it('BrowserWindow는 올바른 설정으로 생성된다', async () => {
            const { createWindow } = await import('@presentation/electron/main');

            createWindow();

            expect(BrowserWindow).toHaveBeenCalledWith(
                expect.objectContaining({
                    width: expect.any(Number),
                    height: expect.any(Number),
                    webPreferences: expect.objectContaining({
                        nodeIntegration: false,
                        contextIsolation: true,
                        preload: expect.any(String),
                    }),
                })
            );
        });
    });

    describe('보안 설정', () => {
        it('nodeIntegration이 비활성화되어야 한다', async () => {
            const { createWindow } = await import('@presentation/electron/main');

            createWindow();

            const calls = (BrowserWindow as any).mock.calls[0];
            expect(calls[0].webPreferences.nodeIntegration).toBe(false);
        });

        it('contextIsolation이 활성화되어야 한다', async () => {
            const { createWindow } = await import('@presentation/electron/main');

            createWindow();

            const calls = (BrowserWindow as any).mock.calls[0];
            expect(calls[0].webPreferences.contextIsolation).toBe(true);
        });
    });
});