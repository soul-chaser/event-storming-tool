/**
 * CreateEventCommand
 *
 * 새로운 Event를 생성하는 명령입니다.
 */
export class CreateEventCommand {
    constructor(
        public readonly boardId: string,
        public readonly name: string,
        public readonly type: string,
        public readonly x: number,
        public readonly y: number,
        public readonly description?: string
    ) {}
}