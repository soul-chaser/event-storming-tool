export interface Point {
    x: number;
    y: number;
}

export interface CardRect {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

const DEFAULT_MARGIN = 24;

export function buildCardConnectionRoute(
    source: CardRect,
    target: CardRect,
    obstacles: CardRect[],
    margin = DEFAULT_MARGIN
): number[] {
    const start = getExitPoint(source, target);
    const end = getExitPoint(target, source);

    const candidates = createCandidates(start, end, source, target, margin);
    const validCandidates = candidates.filter((candidate) => isRouteClear(candidate, obstacles, source, target, margin));
    const selected = selectShortestRoute(validCandidates.length > 0 ? validCandidates : candidates);

    const points = selected.flatMap((point) => [point.x, point.y]);
    return simplifyRoute(points);
}

function createCandidates(start: Point, end: Point, source: CardRect, target: CardRect, margin: number): Point[][] {
    const minY = Math.min(source.top, target.top) - margin;
    const maxY = Math.max(source.bottom, target.bottom) + margin;
    const minX = Math.min(source.left, target.left) - margin;
    const maxX = Math.max(source.right, target.right) + margin;

    return [
        [start, { x: end.x, y: start.y }, end],
        [start, { x: start.x, y: end.y }, end],
        [start, { x: start.x, y: minY }, { x: end.x, y: minY }, end],
        [start, { x: start.x, y: maxY }, { x: end.x, y: maxY }, end],
        [start, { x: minX, y: start.y }, { x: minX, y: end.y }, end],
        [start, { x: maxX, y: start.y }, { x: maxX, y: end.y }, end],
    ];
}

function selectShortestRoute(routes: Point[][]): Point[] {
    return routes.reduce((best, route) => (routeLength(route) < routeLength(best) ? route : best), routes[0]);
}

function routeLength(route: Point[]): number {
    let sum = 0;
    for (let i = 1; i < route.length; i++) {
        sum += Math.abs(route[i].x - route[i - 1].x) + Math.abs(route[i].y - route[i - 1].y);
    }
    return sum;
}

function isRouteClear(route: Point[], obstacles: CardRect[], source: CardRect, target: CardRect, margin: number): boolean {
    const blocked = obstacles.filter((obstacle) => obstacle !== source && obstacle !== target).map((obstacle) => expandRect(obstacle, margin * 0.2));

    for (let i = 1; i < route.length; i++) {
        const a = route[i - 1];
        const b = route[i];
        if (a.x !== b.x && a.y !== b.y) {
            return false;
        }

        for (const obstacle of blocked) {
            if (segmentIntersectsRect(a, b, obstacle)) {
                return false;
            }
        }
    }

    return true;
}

function expandRect(rect: CardRect, delta: number): CardRect {
    return {
        left: rect.left - delta,
        right: rect.right + delta,
        top: rect.top - delta,
        bottom: rect.bottom + delta,
    };
}

function segmentIntersectsRect(a: Point, b: Point, rect: CardRect): boolean {
    if (a.x === b.x) {
        const x = a.x;
        if (x < rect.left || x > rect.right) return false;
        const minY = Math.min(a.y, b.y);
        const maxY = Math.max(a.y, b.y);
        return maxY >= rect.top && minY <= rect.bottom;
    }

    if (a.y === b.y) {
        const y = a.y;
        if (y < rect.top || y > rect.bottom) return false;
        const minX = Math.min(a.x, b.x);
        const maxX = Math.max(a.x, b.x);
        return maxX >= rect.left && minX <= rect.right;
    }

    return true;
}

function getExitPoint(from: CardRect, to: CardRect): Point {
    const fromCenterX = (from.left + from.right) / 2;
    const fromCenterY = (from.top + from.bottom) / 2;
    const toCenterX = (to.left + to.right) / 2;
    const toCenterY = (to.top + to.bottom) / 2;

    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;

    if (Math.abs(dx) >= Math.abs(dy)) {
        return {
            x: dx >= 0 ? from.right : from.left,
            y: fromCenterY,
        };
    }

    return {
        x: fromCenterX,
        y: dy >= 0 ? from.bottom : from.top,
    };
}

function simplifyRoute(points: number[]): number[] {
    if (points.length <= 4) {
        return points;
    }

    const simplified: number[] = [points[0], points[1]];
    for (let i = 2; i < points.length - 2; i += 2) {
        const prevX = simplified[simplified.length - 2];
        const prevY = simplified[simplified.length - 1];
        const currX = points[i];
        const currY = points[i + 1];
        const nextX = points[i + 2];
        const nextY = points[i + 3];

        const sameVertical = prevX === currX && currX === nextX;
        const sameHorizontal = prevY === currY && currY === nextY;
        if (sameVertical || sameHorizontal) {
            continue;
        }

        simplified.push(currX, currY);
    }

    simplified.push(points[points.length - 2], points[points.length - 1]);
    return simplified;
}
