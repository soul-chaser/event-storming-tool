import { CreateEventCommand } from './CreateEventCommand';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { BoardId } from '@domain/value-objects/BoardId';
import { Event } from '@domain/entities/Event';
import { EventName } from '@domain/value-objects/EventName';
import { EventType } from '@domain/value-objects/EventType';
import { Position } from '@domain/value-objects/Position';

/**
 * CreateEventHandler
 *
 * CreateEventCommand를 처리하는 핸들러입니다.
 */
export class CreateEventHandler {
    constructor(private readonly repository: InMemoryEventRepository) {}

    async handle(command: CreateEventCommand): Promise<void> {
        // 1. 보드 로드
        const boardId = new BoardId(command.boardId);
        const board = await this.repository.load(boardId);

        // 2. 도메인 객체 생성
        const event = Event.create({
            name: new EventName(command.name),
            type: new EventType(command.type),
            position: new Position(command.x, command.y),
            description: command.description,
        });

        // 3. 도메인 로직 실행
        board.addEvent(event);

        // 4. 저장
        await this.repository.save(board);
    }
}