import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface AppConfig {
    boardsPath: string;
}

const APP_ROOT_DIR = path.join(os.homedir(), '.event_storming_tool');
const CONFIG_FILENAME = '.config';

export const DEFAULT_BOARDS_PATH = path.join(APP_ROOT_DIR, 'boards');

function getConfigPath(): string {
    return path.join(APP_ROOT_DIR, CONFIG_FILENAME);
}

function normalizeConfig(input: Partial<AppConfig> | null | undefined): AppConfig {
    const boardsPath = input?.boardsPath?.trim();
    return {
        boardsPath: boardsPath ? path.resolve(boardsPath) : DEFAULT_BOARDS_PATH,
    };
}

async function ensureAppRoot(): Promise<void> {
    await fs.mkdir(APP_ROOT_DIR, { recursive: true });
}

export async function loadAppConfig(): Promise<AppConfig> {
    await ensureAppRoot();
    const configPath = getConfigPath();

    try {
        const raw = await fs.readFile(configPath, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<AppConfig>;
        const normalized = normalizeConfig(parsed);
        await fs.mkdir(normalized.boardsPath, { recursive: true });
        return normalized;
    } catch {
        const defaults = normalizeConfig(undefined);
        await saveAppConfig(defaults);
        return defaults;
    }
}

export async function saveAppConfig(nextConfig: Partial<AppConfig>): Promise<AppConfig> {
    await ensureAppRoot();
    const normalized = normalizeConfig(nextConfig);
    await fs.mkdir(normalized.boardsPath, { recursive: true });
    await fs.writeFile(getConfigPath(), JSON.stringify(normalized, null, 2), { mode: 0o600 });
    return normalized;
}
