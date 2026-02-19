import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BoardId } from '@domain/value-objects/BoardId';
import { FileSystemAdapter } from '@infrastructure/adapters/FileSystemAdapter';
import { JSONSerializer } from '@infrastructure/adapters/JSONSerializer';

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

    /**
     * 보드를 저장합니다.
     *
     * @param board - 저장할 보드
     */
    async save(board: EventStormingBoard): Promise<void> {
        const filename = this.getFilename(board.id);
        const json = this.serializer.serialize(board);
        await this.fileSystem.saveFile(filename, json);
    }

    /**
     * 보드를 로드합니다.
     *
     * @param boardId - 로드할 보드 ID
     * @returns EventStormingBoard 인스턴스
     */
    async load(boardId: BoardId): Promise<EventStormingBoard> {
        const filename = this.getFilename(boardId);
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
        const filename = this.getFilename(boardId);
        return await this.fileSystem.fileExists(filename);
    }

    /**
     * 보드를 삭제합니다.
     *
     * @param boardId - 삭제할 보드 ID
     */
    async delete(boardId: BoardId): Promise<void> {
        const filename = this.getFilename(boardId);
        await this.fileSystem.deleteFile(filename);
    }

    /**
     * 모든 보드 ID를 나열합니다.
     *
     * @returns 보드 ID 배열
     */
    async listAll(): Promise<string[]> {
        const files = await this.fileSystem.listFiles('.json');
        return files.map(f => f.replace('.json', ''));
    }

    /**
     * 보드 ID로부터 파일 이름을 생성합니다.
     */
    private getFilename(boardId: BoardId): string {
        return `${boardId.value}.json`;
    }
}