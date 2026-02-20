import { promises as fs } from 'fs';
import * as path from 'path';
import { DomainError } from '@shared/errors/DomainError';

/**
 * FileSystemAdapter
 *
 * 파일 시스템 접근을 위한 어댑터입니다.
 *
 * 보안 기능:
 * - Path Traversal 방지
 * - 파일 크기 제한 (10MB)
 * - 작업 디렉토리 제한
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class FileSystemAdapter {
    private readonly basePath: string;

    constructor(basePath: string) {
        this.basePath = path.resolve(basePath);
    }

    /**
     * 파일을 저장합니다.
     *
     * @param filename - 파일 이름 (상대 경로)
     * @param content - 파일 내용
     */
    async saveFile(filename: string, content: string): Promise<void> {
        const safePath = this.sanitizePath(filename);
        const tempPath = this.sanitizePath(`${filename}.tmp`);

        // 디렉토리 생성
        const dir = path.dirname(safePath);
        await fs.mkdir(dir, { recursive: true });

        // 원자적 저장: 임시 파일에 먼저 쓴 뒤 rename
        await fs.writeFile(tempPath, content, { mode: 0o600 });
        await fs.rename(tempPath, safePath);
    }

    /**
     * 파일을 로드합니다.
     *
     * @param filename - 파일 이름
     * @returns 파일 내용
     */
    async loadFile(filename: string): Promise<string> {
        const safePath = this.sanitizePath(filename);

        // 파일 크기 체크
        const stats = await fs.stat(safePath);
        if (stats.size > MAX_FILE_SIZE) {
            throw new DomainError(`File too large: ${filename}`);
        }

        return await fs.readFile(safePath, 'utf-8');
    }

    /**
     * 파일이 존재하는지 확인합니다.
     *
     * @param filename - 파일 이름
     * @returns 존재 여부
     */
    async fileExists(filename: string): Promise<boolean> {
        try {
            const safePath = this.sanitizePath(filename);
            await fs.access(safePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 파일을 삭제합니다.
     *
     * @param filename - 파일 이름
     */
    async deleteFile(filename: string): Promise<void> {
        try {
            const safePath = this.sanitizePath(filename);
            await fs.unlink(safePath);
        } catch {
            // 파일이 없어도 에러를 발생시키지 않음
        }
    }

    /**
     * 디렉토리의 파일 목록을 반환합니다.
     *
     * @param extension - 필터링할 확장자 (선택)
     * @returns 파일 이름 배열
     */
    async listFiles(extension?: string): Promise<string[]> {
        try {
            const files = await fs.readdir(this.basePath);

            if (extension) {
                return files.filter(f => f.endsWith(extension));
            }

            return files;
        } catch {
            return [];
        }
    }

    /**
     * 경로를 안전하게 정규화합니다.
     *
     * Path Traversal 공격을 방지합니다.
     *
     * @param filename - 파일 이름
     * @returns 안전한 절대 경로
     */
    private sanitizePath(filename: string): string {
        // 절대 경로 변환
        const resolved = path.resolve(this.basePath, filename);

        // basePath를 벗어나는지 체크
        if (!resolved.startsWith(this.basePath)) {
            throw new DomainError('Path traversal detected');
        }

        return resolved;
    }
}
