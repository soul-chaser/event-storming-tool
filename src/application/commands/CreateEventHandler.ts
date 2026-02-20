import { CreateEventCommand } from './CreateEventCommand';
import { InMemoryEventRepository } from '@infrastructure/repositories/InMemoryEventRepository';
import { BoardId } from '@domain/value-objects/BoardId';
import { Event } from '@domain/entities/Event';
import { EventName } from '@domain/value-objects/EventName';
import { EventType } from '@domain/value-objects/EventType';
import { Position } from '@domain/value-objects/Position';
import { EventStormingBoard } from '@domain/services/EventStormingBoard';
import { BOARD_CONSTANTS } from '@domain/value-objects/Position';
import { DomainError } from '@shared/errors/DomainError';

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
        const requestedPosition = new Position(command.x, command.y);
        const availablePosition = this.findAvailablePosition(board, requestedPosition, command.name);

        // 2. 도메인 객체 생성
        const event = Event.create({
            name: new EventName(command.name),
            type: new EventType(command.type),
            position: availablePosition,
            description: command.description,
        });

        // 3. 도메인 로직 실행
        board.addEvent(event);

        // 4. 저장
        await this.repository.save(board);
    }

    private findAvailablePosition(
        board: EventStormingBoard,
        requestedPosition: Position,
        eventName: string
    ): Position {
        if (!board.hasOverlappingEvent(requestedPosition, undefined, eventName)) {
            return requestedPosition;
        }

        const step = 60;
        const maxRing = 30;

        for (let ring = 1; ring <= maxRing; ring++) {
            const distance = ring * step;
            const candidates: Array<{ x: number; y: number }> = [];

            for (let dx = -ring; dx <= ring; dx++) {
                candidates.push({
                    x: requestedPosition.x + (dx * step),
                    y: requestedPosition.y - distance,
                });
                candidates.push({
                    x: requestedPosition.x + (dx * step),
                    y: requestedPosition.y + distance,
                });
            }

            for (let dy = -(ring - 1); dy <= ring - 1; dy++) {
                candidates.push({
                    x: requestedPosition.x - distance,
                    y: requestedPosition.y + (dy * step),
                });
                candidates.push({
                    x: requestedPosition.x + distance,
                    y: requestedPosition.y + (dy * step),
                });
            }

            for (const candidate of candidates) {
                if (!this.isWithinBoard(candidate.x, candidate.y)) {
                    continue;
                }

                const position = new Position(candidate.x, candidate.y);
                if (!board.hasOverlappingEvent(position, undefined, eventName)) {
                    return position;
                }
            }
        }

        throw new DomainError('Unable to find available position near requested point');
    }

    private isWithinBoard(x: number, y: number): boolean {
        return (
            x >= 0 &&
            y >= 0 &&
            x <= BOARD_CONSTANTS.MAX_WIDTH &&
            y <= BOARD_CONSTANTS.MAX_HEIGHT
        );
    }
}
