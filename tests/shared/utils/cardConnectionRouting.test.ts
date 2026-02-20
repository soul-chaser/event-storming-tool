import { describe, expect, it } from 'vitest';
import { buildCardConnectionRoute, CardRect } from '@shared/utils/cardConnectionRouting';

function toSegments(points: number[]): Array<{ x1: number; y1: number; x2: number; y2: number }> {
    const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (let i = 2; i < points.length; i += 2) {
        segments.push({
            x1: points[i - 2],
            y1: points[i - 1],
            x2: points[i],
            y2: points[i + 1],
        });
    }
    return segments;
}

describe('buildCardConnectionRoute', () => {
    const source: CardRect = { left: 100, top: 100, right: 180, bottom: 160 };
    const target: CardRect = { left: 500, top: 120, right: 580, bottom: 180 };

    it('장애물이 없으면 짧은 직교 경로를 만든다', () => {
        const route = buildCardConnectionRoute(source, target, [source, target]);
        expect(route.length).toBeGreaterThanOrEqual(6);
        expect(route[0]).toBe(180);
        expect(route[1]).toBe(130);
        expect(route[route.length - 2]).toBe(500);
        expect(route[route.length - 1]).toBe(150);
    });

    it('중간 장애물이 있으면 우회 경로를 만든다', () => {
        const obstacle: CardRect = { left: 290, top: 110, right: 390, bottom: 170 };
        const route = buildCardConnectionRoute(source, target, [source, target, obstacle]);
        const segments = toSegments(route);

        const intersectsObstacle = segments.some((segment) => {
            if (segment.x1 === segment.x2) {
                const x = segment.x1;
                if (x < obstacle.left || x > obstacle.right) return false;
                const minY = Math.min(segment.y1, segment.y2);
                const maxY = Math.max(segment.y1, segment.y2);
                return maxY >= obstacle.top && minY <= obstacle.bottom;
            }
            const y = segment.y1;
            if (y < obstacle.top || y > obstacle.bottom) return false;
            const minX = Math.min(segment.x1, segment.x2);
            const maxX = Math.max(segment.x1, segment.x2);
            return maxX >= obstacle.left && minX <= obstacle.right;
        });

        expect(intersectsObstacle).toBe(false);
    });
});
