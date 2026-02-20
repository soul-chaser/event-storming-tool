/**
 * RenameEventCommand
 */
export class RenameEventCommand {
    constructor(
        public readonly boardId: string,
        public readonly eventId: string,
        public readonly newName: string
    ) {}
}
