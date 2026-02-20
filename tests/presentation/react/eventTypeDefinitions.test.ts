import { describe, expect, it } from 'vitest';
import { getDefaultEventNameByType } from '@presentation/react/constants/eventTypeDefinitions';

describe('eventTypeDefinitions', () => {
    it('이벤트 타입별 기본 이름을 반환한다', () => {
        expect(getDefaultEventNameByType('domain-event')).toBe('New Domain Event');
        expect(getDefaultEventNameByType('command')).toBe('New Command');
        expect(getDefaultEventNameByType('policy')).toBe('New Policy');
    });

    it('알 수 없는 타입이면 기본 이름을 반환한다', () => {
        expect(getDefaultEventNameByType('unknown-type')).toBe('New Event');
    });
});
