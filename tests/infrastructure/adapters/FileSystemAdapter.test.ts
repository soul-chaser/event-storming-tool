import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileSystemAdapter } from '@infrastructure/adapters/FileSystemAdapter';
import { promises as fs } from 'fs';
import * as path from 'path';
import { DomainError } from '@shared/errors/DomainError';

describe('FileSystemAdapter', () => {
    let adapter: FileSystemAdapter;
    let testDir: string;

    beforeEach(async () => {
        testDir = path.join(process.cwd(), 'test-data');
        await fs.mkdir(testDir, { recursive: true });
        adapter = new FileSystemAdapter(testDir);
    });

    afterEach(async () => {
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        } catch (e) {
            // ignore
        }
    });

    describe('saveFile', () => {
        it('파일을 저장할 수 있다', async () => {
            const filename = 'test.json';
            const content = '{"test": "data"}';

            await adapter.saveFile(filename, content);

            const filePath = path.join(testDir, filename);
            const savedContent = await fs.readFile(filePath, 'utf-8');
            expect(savedContent).toBe(content);
        });

        it('디렉토리가 없으면 자동으로 생성한다', async () => {
            const filename = 'subdir/test.json';
            const content = '{"test": "data"}';

            await adapter.saveFile(filename, content);

            const filePath = path.join(testDir, filename);
            const savedContent = await fs.readFile(filePath, 'utf-8');
            expect(savedContent).toBe(content);
        });

        it('Path Traversal 공격을 방지한다', async () => {
            const filename = '../../../etc/passwd';
            const content = 'malicious';

            await expect(adapter.saveFile(filename, content)).rejects.toThrow(DomainError);
        });

        it('절대 경로는 허용하지 않는다', async () => {
            const filename = '/etc/passwd';
            const content = 'malicious';

            await expect(adapter.saveFile(filename, content)).rejects.toThrow(DomainError);
        });
    });

    describe('loadFile', () => {
        it('파일을 로드할 수 있다', async () => {
            const filename = 'test.json';
            const content = '{"test": "data"}';
            await adapter.saveFile(filename, content);

            const loaded = await adapter.loadFile(filename);

            expect(loaded).toBe(content);
        });

        it('존재하지 않는 파일은 에러를 발생시킨다', async () => {
            await expect(adapter.loadFile('non-existent.json')).rejects.toThrow();
        });

        it('Path Traversal 공격을 방지한다', async () => {
            await expect(adapter.loadFile('../../../etc/passwd')).rejects.toThrow(DomainError);
        });

        it('너무 큰 파일은 로드할 수 없다', async () => {
            const filename = 'large.json';
            const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB

            const filePath = path.join(testDir, filename);
            await fs.writeFile(filePath, largeContent);

            await expect(adapter.loadFile(filename)).rejects.toThrow(DomainError);
        });
    });

    describe('fileExists', () => {
        it('존재하는 파일은 true를 반환한다', async () => {
            const filename = 'test.json';
            await adapter.saveFile(filename, '{}');

            const exists = await adapter.fileExists(filename);

            expect(exists).toBe(true);
        });

        it('존재하지 않는 파일은 false를 반환한다', async () => {
            const exists = await adapter.fileExists('non-existent.json');

            expect(exists).toBe(false);
        });
    });

    describe('deleteFile', () => {
        it('파일을 삭제할 수 있다', async () => {
            const filename = 'test.json';
            await adapter.saveFile(filename, '{}');

            await adapter.deleteFile(filename);

            const exists = await adapter.fileExists(filename);
            expect(exists).toBe(false);
        });

        it('존재하지 않는 파일 삭제는 에러를 발생시키지 않는다', async () => {
            await expect(adapter.deleteFile('non-existent.json')).resolves.not.toThrow();
        });
    });

    describe('listFiles', () => {
        it('디렉토리의 모든 파일을 나열할 수 있다', async () => {
            await adapter.saveFile('file1.json', '{}');
            await adapter.saveFile('file2.json', '{}');
            await adapter.saveFile('file3.json', '{}');

            const files = await adapter.listFiles();

            expect(files).toHaveLength(3);
            expect(files).toContain('file1.json');
            expect(files).toContain('file2.json');
            expect(files).toContain('file3.json');
        });

        it('빈 디렉토리는 빈 배열을 반환한다', async () => {
            const files = await adapter.listFiles();

            expect(files).toHaveLength(0);
        });

        it('특정 확장자만 필터링할 수 있다', async () => {
            await adapter.saveFile('file1.json', '{}');
            await adapter.saveFile('file2.txt', 'text');
            await adapter.saveFile('file3.json', '{}');

            const files = await adapter.listFiles('.json');

            expect(files).toHaveLength(2);
            expect(files).toContain('file1.json');
            expect(files).toContain('file3.json');
        });
    });
});