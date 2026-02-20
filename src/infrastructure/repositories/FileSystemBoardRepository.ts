import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';
import { FileSystemAdapter } from '@infrastructure/adapters/FileSystemAdapter';
import { JSONSerializer } from '@infrastructure/adapters/JSONSerializer';

interface BoardIndexEntry {
    fileName: string;
    name: string;
    updatedAt: string;
}

interface BoardIndex {
    version: 1;
    boards: Record<string, BoardIndexEntry>;
}

export interface BoardSummary {
    id: string;
    name: string;
    fileName: string;
    updatedAt: string;
}

const INDEX_FILENAME = '.board-index.json';

/**
 * FileSystemBoardRepository
 *
 * 파일 시스템 기반 EventStormingBoard 저장소입니다.
 */
export class FileSystemBoardRepository {
    private readonly fileSystem: FileSystemAdapter;
    private readonly serializer: JSONSerializer;

    constructor(basePath: string) {
        this.fileSystem = new FileSystemAdapter(basePath);
        this.serializer = new JSONSerializer();
    }

    async registerBoardName(boardId: BoardId, name: string): Promise<void> {
        const safeName = this.sanitizeBoardName(name);
        const index = await this.readIndex();
        const existing = index.boards[boardId.value];

        if (existing) {
            existing.name = safeName;
            existing.updatedAt = new Date().toISOString();
            await this.writeIndex(index);
            return;
        }

        index.boards[boardId.value] = {
            fileName: this.createFilename(safeName, boardId.value),
            name: safeName,
            updatedAt: new Date().toISOString(),
        };
        await this.writeIndex(index);
    }

    /**
     * 보드를 저장합니다.
     *
     * @param board - 저장할 보드
     */
    async save(board: EventStormingBoard): Promise<void> {
        const filename = await this.getFilename(board.id);
        const json = this.serializer.serialize(board);
        await this.fileSystem.saveFile(filename, json);
        await this.touchBoard(board.id);
    }

    /**
     * 보드를 로드합니다.
     *
     * @param boardId - 로드할 보드 ID
     * @returns EventStormingBoard 인스턴스
     */
    async load(boardId: BoardId): Promise<EventStormingBoard> {
        const filename = await this.getFilename(boardId);
        const json = await this.fileSystem.loadFile(filename);
        return this.serializer.deserialize(json);
    }

    /**
     * 보드가 존재하는지 확인합니다.
     *
     * @param boardId - 확인할 보드 ID
     * @returns 존재 여부
     */
    async exists(boardId: BoardId): Promise<boolean> {
        const filename = await this.getFilename(boardId);
        return await this.fileSystem.fileExists(filename);
    }

    /**
     * 보드를 삭제합니다.
     *
     * @param boardId - 삭제할 보드 ID
     */
    async delete(boardId: BoardId): Promise<void> {
        const filename = await this.getFilename(boardId);
        await this.fileSystem.deleteFile(filename);
        const index = await this.readIndex();
        if (index.boards[boardId.value]) {
            delete index.boards[boardId.value];
            await this.writeIndex(index);
        }
    }

    /**
     * 모든 보드 ID를 나열합니다.
     *
     * @returns 보드 ID 배열
     */
    async listAll(): Promise<string[]> {
        const boardSummaries = await this.listBoards();
        return boardSummaries.map((summary) => summary.id);
    }

    async listBoards(): Promise<BoardSummary[]> {
        const index = await this.readIndex();
        const summaries: BoardSummary[] = [];

        for (const [id, entry] of Object.entries(index.boards)) {
            const exists = await this.fileSystem.fileExists(entry.fileName);
            if (!exists) {
                continue;
            }
            summaries.push({
                id,
                name: entry.name,
                fileName: entry.fileName,
                updatedAt: entry.updatedAt,
            });
        }

        if (summaries.length === 0) {
            const files = await this.fileSystem.listFiles('.json');
            for (const file of files) {
                if (file === INDEX_FILENAME) {
                    continue;
                }

                const legacyId = file.replace('.json', '');
                try {
                    const boardId = new BoardId(legacyId);
                    summaries.push({
                        id: boardId.value,
                        name: legacyId,
                        fileName: file,
                        updatedAt: new Date(0).toISOString(),
                    });
                } catch {
                    continue;
                }
            }
        }

        summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        return summaries;
    }

    private async getFilename(boardId: BoardId): Promise<string> {
        const index = await this.readIndex();
        const entry = index.boards[boardId.value];
        return entry?.fileName ?? `${boardId.value}.json`;
    }

    private sanitizeBoardName(name: string): string {
        const trimmed = name.trim();
        return trimmed.length > 0 ? trimmed : 'Untitled Event Storming';
    }

    private createFilename(name: string, boardId: string): string {
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9-_]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 64);
        const safeSlug = slug.length > 0 ? slug : 'event-storming';
        return `${safeSlug}-${boardId}.json`;
    }

    private async touchBoard(boardId: BoardId): Promise<void> {
        const index = await this.readIndex();
        const entry = index.boards[boardId.value];
        if (!entry) {
            return;
        }
        entry.updatedAt = new Date().toISOString();
        await this.writeIndex(index);
    }

    private async readIndex(): Promise<BoardIndex> {
        const exists = await this.fileSystem.fileExists(INDEX_FILENAME);
        if (!exists) {
            return { version: 1, boards: {} };
        }

        try {
            const raw = await this.fileSystem.loadFile(INDEX_FILENAME);
            const parsed = JSON.parse(raw) as Partial<BoardIndex>;
            return {
                version: 1,
                boards: parsed.boards ?? {},
            };
        } catch {
            return { version: 1, boards: {} };
        }
    }

    private async writeIndex(index: BoardIndex): Promise<void> {
        await this.fileSystem.saveFile(INDEX_FILENAME, JSON.stringify(index, null, 2));
    }
}
