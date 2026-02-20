import { describe, expect, it } from 'vitest';

import { formatBoardAsMermaid, formatBoardAsPlantUML } from '@application/services/BoardExportFormatter';

const sampleBoard = {
    id: 'board-1',
    events: [
        {
            id: 'evt-2',
            name: 'Payment Authorized',
            type: 'domain-event',
            position: { x: 400, y: 200 },
            color: '#fff',
        },
        {
            id: 'evt-1',
            name: 'Order Created',
            type: 'domain-event',
            position: { x: 100, y: 200 },
            color: '#fff',
        },
    ],
    aggregates: [
        {
            id: 'agg-1',
            name: 'Order Aggregate',
            eventIds: ['evt-1', 'evt-2'],
        },
    ],
};

describe('BoardExportFormatter', () => {
    it('formats board as Mermaid flowchart', () => {
        const result = formatBoardAsMermaid(sampleBoard as any);

        expect(result).toContain('flowchart LR');
        expect(result).toContain('evt_1["Order Created"]');
        expect(result).toContain('evt_2["Payment Authorized"]');
        expect(result).toContain('evt_1 --> evt_2');
        expect(result).toContain('subgraph agg_1["Order Aggregate"]');
    });

    it('formats board as PlantUML', () => {
        const result = formatBoardAsPlantUML(sampleBoard as any);

        expect(result).toContain('@startuml');
        expect(result).toContain('left to right direction');
        expect(result).toContain('rectangle "Order Created" as evt_1');
        expect(result).toContain('rectangle "Payment Authorized" as evt_2');
        expect(result).toContain('evt_1 --> evt_2');
        expect(result).toContain('package "Order Aggregate" as agg_1 {');
        expect(result).toContain('@enduml');
    });
});
