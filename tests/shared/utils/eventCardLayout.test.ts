import { describe, expect, it } from 'vitest';
import { getEventCardDimensions } from '@shared/utils/eventCardLayout';

describe('eventCardLayout', () => {
    it('줄바꿈이 많을수록 카드 높이가 증가한다', () => {
        const shortText = getEventCardDimensions('한 줄');
        const multiLineText = getEventCardDimensions('1줄\n2줄\n3줄\n4줄\n5줄');

        expect(multiLineText.height).toBeGreaterThan(shortText.height);
    });
});
