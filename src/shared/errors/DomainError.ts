/**
 * DomainError
 *
 * 도메인 규칙(비즈니스 규칙) 위반 시 발생하는 에러입니다.
 *
 * 사용 예시:
 * - Position이 음수일 때
 * - Event 이름이 비어있을 때
 * - 보드 경계를 벗어날 때
 * - 중복된 이벤트를 추가하려 할 때
 */
export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainError';

        // TypeScript에서 Error 상속 시 필요한 설정
        Object.setPrototypeOf(this, DomainError.prototype);
    }

    /**
     * 에러가 DomainError 타입인지 확인하는 타입 가드
     *
     * @param error - 확인할 에러 객체
     * @returns DomainError이면 true
     */
    static isDomainError(error: unknown): error is DomainError {
        return error instanceof DomainError;
    }
}