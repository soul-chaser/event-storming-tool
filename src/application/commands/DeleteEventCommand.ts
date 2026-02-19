/**
 * DeleteEventCommand
 */
export class DeleteEventCommand {
    constructor(
        public readonly boardId: string,
        public readonly eventId: string
    ) {}
}