/**
 * UpdateEventDescriptionCommand
 */
export class UpdateEventDescriptionCommand {
    constructor(
        public readonly boardId: string,
        public readonly eventId: string,
        public readonly description?: string
    ) {}
}
