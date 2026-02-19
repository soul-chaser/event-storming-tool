/**
 * MoveEventCommand
 */
export class MoveEventCommand {
    constructor(
        public readonly boardId: string,
        public readonly eventId: string,
        public readonly newX: number,
        public readonly newY: number
    ) {}
}